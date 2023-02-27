import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture, testingDB } from 'api/utils/testing_db';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { getStats } from '../stats';

const fixtureFactory = getFixturesFactory();

const fixtures: DBFixture = {
  ixsuggestions: [
    {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.labelEmpty,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.labelMatch,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.labelMismatch,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.valueEmpty,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.valueMatch,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.valueMismatch,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.obsolete,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.empty,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.emptyMismatch,
    },
  ],
};

beforeAll(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('when the property exists', () => {
  it('should return the training counts', async () => {
    expect(await getStats('age')).toMatchObject({
      counts: {
        labeled: 3,
        nonLabeledMatching: 1,
        nonLabeledNotMatching: 1,
        emptyOrObsolete: 4,
        all: fixtures.ixsuggestions!.length,
      },
    });
  });

  it.each([
    {
      state: SuggestionState.labelMatch,
      action: 'count as correct',
      result: 1,
    },
    {
      state: SuggestionState.labelMismatch,
      action: 'count as incorrect',
      result: 0,
    },
    {
      state: SuggestionState.valueMatch,
      action: 'count as correct',
      result: 1,
    },
    {
      state: SuggestionState.valueMismatch,
      action: 'count as incorrect',
      result: 0,
    },
    {
      state: SuggestionState.empty,
      action: 'not count',
      result: 0,
    },
    {
      state: SuggestionState.obsolete,
      action: 'not count',
      result: 0,
    },
    {
      state: SuggestionState.labelEmpty,
      action: 'count as incorrect',
      result: 0,
    },
    {
      state: SuggestionState.valueEmpty,
      action: 'count as incorrect',
      result: 0,
    },
    {
      state: SuggestionState.error,
      action: 'not count',
      result: 0,
    },
    {
      state: SuggestionState.processing,
      action: 'not count',
      result: 0,
    },
    {
      state: SuggestionState.emptyMismatch,
      action: 'not count',
      result: 0,
    },
  ])('$state state should $action in accuracy', async ({ state, result }) => {
    const input = {
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state,
    };
    await testingEnvironment.setUp({ ixsuggestions: [input] });
    const stats = await getStats('age');
    expect(stats.accuracy).toEqual(result);
  });

  it.each([
    {
      states: [SuggestionState.labelMatch, SuggestionState.labelMismatch, SuggestionState.empty],
    },
    {
      states: [
        SuggestionState.valueMatch,
        SuggestionState.valueMismatch,
        SuggestionState.processing,
      ],
    },
    {
      states: [
        SuggestionState.labelMatch,
        SuggestionState.labelEmpty,
        SuggestionState.emptyMismatch,
      ],
    },
    {
      states: [SuggestionState.valueMatch, SuggestionState.valueEmpty, SuggestionState.error],
    },
  ])('should return accuracy correctly', async ({ states }) => {
    const inputs = states.map(state => ({
      _id: testingDB.id(),
      entityId: '',
      entityTemplate: fixtureFactory.id('template').toString(),
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state,
    }));
    await testingEnvironment.setUp({ ixsuggestions: inputs });
    const stats = await getStats('age');
    expect(stats.accuracy).toEqual(0.5);
  });
});

describe('when the property does not exists', () => {
  it('should not fail', async () => {
    await getStats('non existent prop');
  });
});
