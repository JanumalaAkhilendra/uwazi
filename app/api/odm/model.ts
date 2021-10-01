// import { ObjectId, WithId as _WithId } from 'mongodb';
import mongoose, {
  Schema,
  UpdateQuery,
  ModelUpdateOptions,
  FilterQuery,
  QueryOptions,
} from 'mongoose';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { MultiTenantMongooseModel } from './MultiTenantMongooseModel';
import { createUpdateLogHelper, UpdateLogger } from './logHelper';

/** WithId<T> represents objects received from MongoDB, which are guaranteed to have
 *  the _id field populated, even though T always has _id? optional for validation reasons.
 */
export type WithId<T> = T & { _id: ObjectIdSchema };

export type DataType<T> = WithId<T>;
export type PartialDataType<T> = Partial<DataType<T>>;

export type UwaziFilterQuery<T> = FilterQuery<DataType<T>>;
export type UwaziUpdateQuery<T> = UpdateQuery<PartialDataType<T>>;
export type UwaziQueryOptions = QueryOptions;

const generateID = mongoose.Types.ObjectId;
export { generateID };

export class OdmModel<T> {
  db: MultiTenantMongooseModel<T>;

  logHelper: UpdateLogger<T>;

  private documentExists(data: PartialDataType<T>) {
    return this.db.findById(data._id, '_id');
  }

  constructor(logHelper: UpdateLogger<T>, collectionName: string, schema: Schema) {
    this.db = new MultiTenantMongooseModel(collectionName, schema);
    this.logHelper = logHelper;
  }

  async save(data: PartialDataType<T>, query?: any) {
    if (await this.documentExists(data)) {
      const updateData = data as UwaziUpdateQuery<T>;
      const saved = await this.db.findOneAndUpdate(query || { _id: data._id }, updateData, {
        new: true,
      });
      if (saved === null) {
        throw Error('The document was not updated!');
      }
      await this.logHelper.upsertLogOne(saved);
      return saved.toObject<WithId<T>>();
    }
    const saved = await this.db.create(data);
    await this.logHelper.upsertLogOne(saved);
    return saved.toObject<WithId<T>>();
  }

  async saveMultiple(data: PartialDataType<T>[]) {
    return Promise.all(data.map(async d => this.save(d)));
  }

  async updateMany(
    conditions: UwaziFilterQuery<T>,
    doc: UpdateQuery<T>,
    options: ModelUpdateOptions = {}
  ) {
    await this.logHelper.upsertLogMany(conditions);
    return this.db._updateMany(conditions, doc, options);
  }

  async count(query: UwaziFilterQuery<T> = {}) {
    return this.db.countDocuments(query);
  }

  get(query: UwaziFilterQuery<T> = {}, select: any = '', options = {}) {
    return this.db.find(query, select, { lean: true, ...options });
  }

  async getById(id: any | string | number, select?: any) {
    return this.db.findById(id, select);
  }

  async delete(condition: any) {
    let cond = condition;
    if (mongoose.Types.ObjectId.isValid(condition)) {
      cond = { _id: condition };
    }
    await this.logHelper.upsertLogMany(cond, true);
    return this.db.deleteMany(cond);
  }
}

// models are accessed in api/sync, which cannot be type-safe since the document
// type is a request parameter. Thus, we store all OdmModels as type Document.
// eslint-disable-next-line
export let models: { [index: string]: OdmModel<any> } = {};

export function instanceModel<T = any>(collectionName: string, schema: mongoose.Schema) {
  const logHelper = createUpdateLogHelper<T>(collectionName);
  const model = new OdmModel<T>(logHelper, collectionName, schema);
  models[collectionName] = model;
  return model;
}
