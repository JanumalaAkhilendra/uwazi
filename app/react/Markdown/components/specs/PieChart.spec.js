import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { mapStateToProps, PieChartComponent } from '../PieChart.js';
import markdownDatasets from '../../markdownDatasets';

describe('BarChart Markdown component', () => {
  const state = {
    thesauris: Immutable.fromJS([{
      _id: 'tContext',
      values: [
        { id: 'id1', label: 'label1' },
        { id: 'id2', label: 'label2' },
        { id: 'id3', label: 'label3' },
        { id: 'id6', label: 'label6' },
        { id: 'id7', label: 'label7' },
        { id: 'id8', label: 'label8' },
      ]
    }]),
  };

  it('should render the data passed by mapStateToProps and ignore "0" values', () => {
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(Immutable.fromJS([
      { key: 'id1', filtered: { doc_count: 25 } },
      { key: 'id2', filtered: { doc_count: 33 } },
      { key: 'missing', filtered: { doc_count: 45 } },
      { key: 'id3', filtered: { doc_count: 13 } },
      { key: 'id6', filtered: { doc_count: 0 } },
      { key: 'id8', },
    ]));

    const props = mapStateToProps(state, { prop1: 'propValue' });
    const component = shallow(<PieChartComponent {...props} property="prop1" classname="custom-class" context="tContext" />);

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(undefinedValue);
    const props = mapStateToProps(state, { prop2: 'propValue' });
    const component = shallow(<PieChartComponent {...props} property="prop2"/>);

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });
});
