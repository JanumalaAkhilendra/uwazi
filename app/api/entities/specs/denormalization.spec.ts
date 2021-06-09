/* eslint-disable max-lines */
import db, { DBFixture } from 'api/utils/testing_db';
import entities from 'api/entities';

import { EntitySchema } from 'shared/types/entityType';
import thesauris from 'api/thesauri';
import { getFixturesFactory } from '../../utils/fixturesFactory';

const load = async (data: DBFixture) =>
  db.setupFixturesAndContext(
    {
      ...data,
      settings: [{ _id: db.id(), languages: [{ key: 'en', default: true }, { key: 'es' }] }],
      translations: [
        { locale: 'en', contexts: [] },
        { locale: 'es', contexts: [] },
      ],
    },
    // 'elastic-denormalize-spec-index'
  );

describe('Denormalize relationships', () => {
  const factory = getFixturesFactory();

  const modifyEntity = async (id: string, entityData: EntitySchema, language: string = 'en') => {
    await entities.save(
      { _id: factory.id(`${id}-${language}`), sharedId: id, ...entityData, language },
      { language, user: {} },
      true
    );
  };

  afterAll(async () => db.disconnect());

  describe('title and basic property (text)', () => {
    it('should update title, icon and text property on related entities denormalized properties', async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [
            factory.inherit('relationship', 'templateB', 'text'),
            factory.inherit('relationship2', 'templateC', 'another_text'),
          ]),
          factory.template('templateB', [factory.property('text')]),
          factory.template('templateC', [factory.property('another_text')]),
        ],
        entities: [
          factory.entity('A1', 'templateA', {
            relationship: [factory.metadataValue('B1'), factory.metadataValue('B2')],
            relationship2: [factory.metadataValue('C1')],
          }),
          factory.entity(
            'B1',
            'templateB',
            {},
            {
              icon: { _id: 'icon_id', label: 'icon_label', type: 'icon_type' },
            }
          ),
          factory.entity('B2', 'templateB'),
          factory.entity('C1', 'templateC'),
        ],
      };

      await load(fixtures);

      await modifyEntity('B1', {
        title: 'new Title',
        metadata: { text: [{ value: 'text 1 changed' }] },
      });

      await modifyEntity('B2', {
        title: 'new Title 2',
        metadata: { text: [{ value: 'text 2 changed' }] },
      });

      await modifyEntity('C1', {
        title: 'new Title C1',
        metadata: { another_text: [{ value: 'another text changed' }] },
      });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata).toMatchObject({
        relationship: [
          {
            label: 'new Title',
            icon: { _id: 'icon_id', label: 'icon_label', type: 'icon_type' },
            inheritedValue: [{ value: 'text 1 changed' }],
          },
          {
            label: 'new Title 2',
            inheritedValue: [{ value: 'text 2 changed' }],
          },
        ],
        relationship2: [
          {
            label: 'new Title C1',
            inheritedValue: [{ value: 'another text changed' }],
          },
        ],
      });
    });

    it('should update title and text property denormalized on related entities from 2 different templates', async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [factory.property('text')]),
          factory.template('templateB', [factory.inherit('relationship_b', 'templateA', 'text')]),
          factory.template('templateC', [factory.inherit('relationship_c', 'templateA', 'text')]),
        ],
        entities: [
          factory.entity('A1', 'templateA'),
          factory.entity('B1', 'templateB', { relationship_b: [factory.metadataValue('A1')] }),
          factory.entity('B2', 'templateB', { relationship_b: [factory.metadataValue('A1')] }),
          factory.entity('C1', 'templateC', { relationship_c: [factory.metadataValue('A1')] }),
        ],
      };

      await load(fixtures);

      await modifyEntity('A1', {
        title: 'new A1',
        metadata: { text: [{ value: 'text 1 changed' }] },
      });

      const [relatedB1, relatedB2, relatedC] = [
        await entities.getById('B1', 'en'),
        await entities.getById('B2', 'en'),
        await entities.getById('C1', 'en'),
      ];

      expect(relatedB1?.metadata?.relationship_b).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'text 1 changed' }] },
      ]);

      expect(relatedB2?.metadata?.relationship_b).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'text 1 changed' }] },
      ]);

      expect(relatedC?.metadata?.relationship_c).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'text 1 changed' }] },
      ]);
    });

    it('should update title and 2 differente text properties denormalized on related entities', async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [factory.property('text1'), factory.property('text2')]),
          factory.template('templateB', [factory.inherit('relationship_b', 'templateA', 'text1')]),
          factory.template('templateC', [factory.inherit('relationship_c', 'templateA', 'text2')]),
        ],
        entities: [
          factory.entity('A1', 'templateA'),
          factory.entity('B1', 'templateB', { relationship_b: [factory.metadataValue('A1')] }),
          factory.entity('C1', 'templateC', { relationship_c: [factory.metadataValue('A1')] }),
        ],
      };

      await load(fixtures);

      await modifyEntity('A1', {
        title: 'new A1',
        metadata: { text1: [{ value: 'text 1 changed' }], text2: [{ value: 'text 2 changed' }] },
      });

      const [relatedB, relatedC] = [
        await entities.getById('B1', 'en'),
        await entities.getById('C1', 'en'),
      ];

      expect(relatedB?.metadata?.relationship_b).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'text 1 changed' }] },
      ]);

      expect(relatedC?.metadata?.relationship_c).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'text 2 changed' }] },
      ]);
    });
  });

  describe('inherited select/multiselect (thesauri)', () => {
    beforeEach(async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [
            factory.inherit('relationship', 'templateB', 'multiselect'),
          ]),
          factory.template('templateB', [
            factory.property('multiselect', 'multiselect', {
              content: factory.id('thesauri').toString(),
            }),
          ]),
        ],
        dictionaries: [factory.thesauri('thesauri', ['T1', 'T2', 'T3'])],
        entities: [
          factory.entity('A1', 'templateA', {
            relationship: [factory.metadataValue('B1'), factory.metadataValue('B2')],
          }),
          factory.entity('B1', 'templateB', {
            multiselect: [factory.metadataValue('T1')],
          }),
          factory.entity('B2', 'templateB'),
        ],
      };
      await load(fixtures);
    });

    it('should update denormalized properties when thesauri selected changes', async () => {
      await modifyEntity('B1', {
        metadata: { multiselect: [{ value: 'T2' }, { value: 'T3' }] },
      });

      await modifyEntity('B2', {
        metadata: { multiselect: [{ value: 'T1' }] },
      });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata?.relationship).toMatchObject([
        {
          inheritedValue: [
            { value: 'T2', label: 'T2' },
            { value: 'T3', label: 'T3' },
          ],
        },
        {
          inheritedValue: [{ value: 'T1', label: 'T1' }],
        },
      ]);
    });

    it('should update denormalized properties when thesauri label changes', async () => {
      await modifyEntity('B1', {
        metadata: { multiselect: [{ value: 'T2' }, { value: 'T3' }] },
      });
      await modifyEntity('B2', {
        metadata: { multiselect: [{ value: 'T1' }] },
      });

      await modifyEntity('A1', {
        metadata: {
          relationship: [factory.metadataValue('B1'), factory.metadataValue('B2')],
        },
      });

      await thesauris.save(factory.thesauri('thesauri', [['T1', 'new 1'], 'T2', ['T3', 'new 3']]));

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata?.relationship).toMatchObject([
        {
          inheritedValue: [
            { value: 'T2', label: 'T2' },
            { value: 'T3', label: 'new 3' },
          ],
        },
        {
          inheritedValue: [{ value: 'T1', label: 'new 1' }],
        },
      ]);
    });
  });

  describe('inherited relationship', () => {
    beforeEach(async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [
            factory.inherit('relationship', 'templateB', 'relationshipB'),
          ]),
          factory.template('templateB', [factory.relationshipProp('relationshipB', 'templateC')]),
          factory.template('templateC'),
        ],
        entities: [
          factory.entity('A1', 'templateA', { relationship: [{ value: 'B1' }, { value: 'B2' }] }),
          factory.entity('B1', 'templateB'),
          factory.entity('B2', 'templateB'),
          factory.entity('C1', 'templateC'),
          factory.entity('C2', 'templateC'),
        ],
      };
      await load(fixtures);
      await modifyEntity('B1', { metadata: { relationshipB: [{ value: 'C1' }] } });
      await modifyEntity('B2', { metadata: { relationshipB: [{ value: 'C2' }] } });
    });

    it('should update denormalized properties when relationship selected changes', async () => {
      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata?.relationship).toMatchObject([
        { inheritedValue: [{ value: 'C1', label: 'C1' }] },
        { inheritedValue: [{ value: 'C2', label: 'C2' }] },
      ]);
    });

    it('should update denormalized properties when relationship inherited label changes', async () => {
      await modifyEntity('C1', { title: 'new C1' });
      await modifyEntity('C2', { title: 'new C2' });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata?.relationship).toMatchObject([
        { inheritedValue: [{ value: 'C1', label: 'new C1' }] },
        { inheritedValue: [{ value: 'C2', label: 'new C2' }] },
      ]);
    });
  });

  describe('languages', () => {
    it('should denormalize the title and a simple property in the correct language', async () => {
      await load({
        templates: [
          factory.template('templateA', [
            factory.inherit('relationshipA', 'templateB', 'relationshipB'),
          ]),
          factory.template('templateB', [factory.inherit('relationshipB', 'templateC', 'text')]),
          factory.template('templateC', [factory.property('text')]),
        ],
        entities: [
          factory.entity('A1', 'templateA', { relationshipA: [factory.metadataValue('B1')] }),
          factory.entity(
            'A1',
            'templateA',
            { relationshipA: [factory.metadataValue('B1')] },
            { language: 'es' }
          ),
          factory.entity('B1', 'templateB', { relationshipB: [factory.metadataValue('C1')] }),
          factory.entity(
            'B1',
            'templateB',
            { relationshipB: [factory.metadataValue('C1')] },
            { language: 'es' }
          ),
          factory.entity('C1', 'templateC'),
          factory.entity('C1', 'templateC', {}, { language: 'es' }),
        ],
      });

      /// generate inherited values !
      await modifyEntity('B1', { relationshipB: [factory.metadataValue('C1')] }, 'en');
      await modifyEntity('B1', { relationshipB: [factory.metadataValue('C1')] }, 'es');

      await modifyEntity('A1', { relationshipA: [factory.metadataValue('B1')] }, 'en');
      await modifyEntity('A1', { relationshipA: [factory.metadataValue('B1')] }, 'es');

      await modifyEntity('C1', { metadata: { text: [{ value: 'text' }] } });
      await modifyEntity('C1', { metadata: { text: [{ value: 'texto' }] } }, 'es');
      /// generate inherited values !

      await modifyEntity('C1', { title: 'new Es title', metadata: { text: [{ value: 'nuevo texto para ES' }] } }, 'es');

      const relatedEn = await entities.getById('B1', 'en');
      const relatedEs = await entities.getById('B1', 'es');

      expect(relatedEn?.metadata?.relationshipB).toMatchObject([
        { value: 'C1', inheritedValue: [{ value: 'text' }] },
      ]);
      expect(relatedEs?.metadata?.relationshipB).toMatchObject([
        { value: 'C1', inheritedValue: [{ value: 'nuevo texto para ES' }] },
      ]);

      const transitiveEn = await entities.getById('A1', 'en');
      const transitiveEs = await entities.getById('A1', 'es');

      expect(transitiveEn?.metadata?.relationshipA).toMatchObject([
        { value: 'B1', inheritedValue: [{ label: 'C1' }] },
      ]);

      expect(transitiveEs?.metadata?.relationshipA).toMatchObject([
        { value: 'B1', inheritedValue: [{ label: 'new Es title' }] },
      ]);
    });
  });
});
