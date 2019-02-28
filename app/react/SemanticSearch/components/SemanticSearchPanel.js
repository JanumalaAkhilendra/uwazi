import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Field, LocalForm, actions } from 'react-redux-form';

import { t } from 'app/I18N';
import { Icon, } from 'UI';
import ShowIf from 'app/App/ShowIf';
import { hideSemanticSearch } from 'app/SemanticSearch/actions/actions';
import { fetchSearches, submitNewSearch } from '../actions/actions';

import SidePanel from 'app/Layout/SidePanel';
import SearchList from './SearchList';

export class SemanticSearchSidePanel extends Component {
  constructor(props) {
    super(props);

    this.onSubmit = this.onSubmit.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.showMainPage = this.showMainPage.bind(this);
    this.showNewSearchPage = this.showNewSearchPage.bind(this);
  }

  componentDidMount() {
    if (!this.props.searches.size) {
      this.props.fetchSearches();
    }
  }

  async onSubmit(model) {
    const { currentSearch, selectedDocuments } = this.props;
    const { searchTerm } = model;
    const documents = selectedDocuments ?
      selectedDocuments.toJS().map(doc => doc.sharedId) : [];
    this.props.submitNewSearch({
      searchTerm,
      documents,
      query: currentSearch
    });
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  showMainPage() {
    this.setState({ page: 'main' });
  }

  showNewSearchPage() {
    this.setState({ page: 'new' });
  }

  submitForm() {
    this.formDispatch(actions.submit('searchText'));
  }

  render() {
    const searches = this.props.searches.toJS();
    return (
      <SidePanel open={this.props.open} className="metadata-sidepanel semantic-search">
        <button className="closeSidepanel close-modal" onClick={this.props.hideSemanticSearch}>
          <Icon icon="times" />
        </button>
        <div className="sidepanel-header">
          <span className="sidepanel-title">{t('System', 'Semantic search')}</span>
          <LocalForm
            model="searchText"
            autoComplete="off"
            onSubmit={this.onSubmit}
            getDispatch={dispatch => this.attachDispatch(dispatch)}
          >
            <div className="input-group">
              <Field model=".searchTerm">
                <input
                  type="text"
                  placeholder={t('System', 'Search', null, false)}
                  className="form-control"
                  autoComplete="off"
                />
              </Field>
              <button className="btn btn-default new-search" type="submit">{t('System', 'Start new search')}</button>
            </div>
          </LocalForm>
        </div>
        <div className="sidepanel-body">
          <ShowIf if={!!searches}>
            <SearchList searches={searches} />
          </ShowIf>
        </div>
      </SidePanel>
    );
  }
}

SemanticSearchSidePanel.propTypes = {
  currentSearch: PropTypes.object.isRequired,
  selectedDocuments: PropTypes.object.isRequired,
  searches: PropTypes.object.isRequired,
  hideSemanticSearch: PropTypes.func.isRequired,
  fetchSearches: PropTypes.func.isRequired,
  submitNewSearch: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export function mapStateToProps(state, props) {
  return {
    currentSearch: state[props.storeKey].search,
    selectedDocuments: state[props.storeKey].ui.get('selectedDocuments'),
    searches: state.semanticSearch.searches,
    open: state.semanticSearch.showSemanticSearchPanel
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSearches,
    submitNewSearch,
    hideSemanticSearch
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SemanticSearchSidePanel);
