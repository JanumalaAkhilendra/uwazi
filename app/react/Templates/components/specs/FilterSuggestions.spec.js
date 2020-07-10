import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { SimilarProperty } from 'app/Templates/components/FilterSuggestions';
import { FilterSuggestions } from '../FilterSuggestions';

describe('FilterSuggestions', () => {
  let component;
  let props;
  let templates;
  let thesauri;

  function renderComponent(label = 'test', type = 'text', content) {
    templates = [
      {
        _id: 'template1',
        properties: [
          { localID: 1, label, filter: true, type },
          { localID: 2, label: 'something else' },
          { label: 'Date', type: 'date', filter: true },
        ],
      },
      {
        _id: 'template2',
        name: 'Template 2',
        properties: [
          { label: 'Date', type: 'date', filter: true },
          { label: 'Author', type: 'text', filter: true },
          { label: 'filterFalse', type: 'text', filter: false },
          { label: 'Authors', type: 'select', filter: true, content: 'abc1' },
        ],
      },
      {
        _id: 'template3',
        name: 'Template 3',
        properties: [
          { label: 'date ', type: 'date', filter: true },
          { label: 'filterFalse', type: 'text', filter: true },
          { label: 'Keywords', type: 'text', filter: true },
        ],
      },
    ];

    thesauri = [
      { _id: 'abc1', name: 'Best SCI FI Authors' },
      { _id: 'abc2', name: 'Favourite dessert recipes' },
    ];

    props = {
      label,
      type,
      filter: true,
      content,
      templateName: 'Current template',
      templateId: 'template1',
      templates: Immutable.fromJS(templates),
      thesauri: Immutable.fromJS(thesauri),
    };

    component = shallow(<FilterSuggestions {...props} />);
  }

  it('should always render the current property as a guide', () => {
    renderComponent('Year', 'date');
    const suggestion = component.find({
      templateProperty: { template: 'Current template (this template)' },
    });
    expect(suggestion.props().templateProperty.type).toBe('Date');
  });

  describe('when there are other templates properties with the same label', () => {
    it('should render all the matched properties in other templates', () => {
      renderComponent('Date', 'text');
      const suggestion = component.find(SimilarProperty);
      expect(suggestion.length).toBe(3);
      expect(suggestion.get(0).props.templateProperty.template).toBe(
        'Current template (this template)'
      );
      expect(suggestion.get(1).props.templateProperty.template).toBe('Template 2');
      expect(suggestion.get(2).props.templateProperty.template).toBe('Template 3');
    });

    it('should not be a type conflict if type+ matches', () => {
      renderComponent('author', 'text');
      const suggestion = component.find({
        templateProperty: { template: 'Template 2' },
      });
      expect(suggestion.props().templateProperty.typeConflict).toBe(false);
    });

    it('should be a type conflict if type does not match', () => {
      renderComponent('author', 'date');
      const suggestion = component.find({
        templateProperty: { template: 'Template 2' },
      });
      expect(suggestion.props().templateProperty.typeConflict).toBe(true);
    });

    it('should be a content conflict if content does not match ', () => {
      renderComponent('authors', 'select', 'abc2');
      const suggestion = component.find({
        templateProperty: { template: 'Template 2' },
      });
      expect(suggestion.props().templateProperty.contentConflict).toBe(true);
    });
  });
});
