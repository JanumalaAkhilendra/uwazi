import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { SelectionHandler, Highlight, SelectionRegion } from 'react-pdf-handler';
import { advancedSort } from 'app/utils/advancedSort';
import Immutable from 'immutable';

import { isClient } from '../../utils';
import PDFJS from '../PDFJS';
import PDFPage from './PDFPage.js';

class PDF extends Component {
  static getDerivedStateFromProps(props, state) {
    if (state.filename !== null && state.filename !== props.filename) {
      return { pdf: { numPages: 0 }, filename: props.filename };
    }

    return null;
  }

  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = { pdf: { numPages: 0 }, filename: props.filename };
    this.pagesLoaded = {};
    this.loadDocument(props.file);
    this.currentPage = '1';
    this.pages = {};
    this.pdfReady = false;

    this.pageUnloaded = this.pageUnloaded.bind(this);
    this.pageLoading = this.pageLoading.bind(this);
    this.onPageVisible = this.onPageVisible.bind(this);
    this.onPageHidden = this.onPageHidden.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    if (this.pdfContainer) {
      document.addEventListener('textlayerrendered', e => {
        this.pageLoaded(e.detail.pageNumber);
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.file !== this.props.file ||
      nextProps.filename !== this.props.filename ||
      nextProps.pdfInfo !== this.props.pdfInfo ||
      nextProps.style !== this.props.style ||
      nextProps.activeReference !== this.props.activeReference ||
      nextState.pdf !== this.state.pdf
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.filename !== null && this.props.filename !== prevProps.filename) {
      this.pagesLoaded = {};
      this.loadDocument(prevProps.file);
    }

    if (this.state.pdf.numPages && !this.pdfReady) {
      this.pdfReady = true;
      this.props.onPDFReady();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onPageVisible(page, visibility) {
    this.pages[page] = visibility;

    const pageWithMostVisibility = Object.keys(this.pages).reduce((memo, key) => {
      if (!this.pages[key - 1] || this.pages[key] > this.pages[key - 1]) {
        return key;
      }
      return memo;
    }, 1);

    if (this.currentPage !== pageWithMostVisibility) {
      this.currentPage = pageWithMostVisibility;
      this.props.onPageChange(Number(pageWithMostVisibility));
    }
  }

  onPageHidden(page) {
    delete this.pages[page];
  }

  loadDocument(file) {
    if (isClient) {
      PDFJS.getDocument(file).promise.then(pdf => {
        if (this._isMounted) {
          this.setState({ pdf });
        }
      });
    }
  }

  pageUnloaded(numPage) {
    delete this.pagesLoaded[numPage];
    this.loaded();
  }

  pageLoading(numPage) {
    this.pagesLoaded[numPage] = false;
  }

  pageLoaded(numPage) {
    this.pagesLoaded[numPage] = true;
    const allPagesLoaded =
      Object.keys(this.pagesLoaded)
        .map(p => this.pagesLoaded[p])
        .filter(p => !p).length === 0;
    if (allPagesLoaded) {
      this.loaded();
    }
  }

  loaded() {
    const pages = Object.keys(this.pagesLoaded).map(n => parseInt(n, 10));

    const allConsecutives = advancedSort(pages, { treatAs: 'number' }).reduce((memo, number) => {
      if (memo === false) {
        return memo;
      }

      if (memo === null) {
        return number;
      }

      return number - memo > 1 ? false : number;
    }, null);

    if (allConsecutives) {
      const { pdfInfo } = this.props;
      const start = pdfInfo[
        Math.min.apply(
          null,
          Object.keys(this.pagesLoaded).map(n => parseInt(n, 10))
        ) - 1
      ] || { chars: 0 };
      const end = pdfInfo[
        Math.max.apply(
          null,
          Object.keys(this.pagesLoaded).map(n => parseInt(n, 10))
        )
      ] || { chars: 0 };
      this.props.onLoad({
        start: start.chars,
        end: end.chars,
        pages,
      });
    }
  }

  highlightReference(connection, event) {
    event.stopPropagation();
    this.props.highlightReference(connection);
  }

  renderReferences(page) {
    const references = this.props.references.toJS();
    return references.map(r => {
      const color = r._id === this.props.activeReference ? '#ffd84b' : '#feeeb4';
      return (
        <div
          data-id={r._id}
          key={r._id}
          className="reference"
          onClick={this.highlightReference.bind(this, r)}
        >
          <Highlight regionId={page} highlight={r.reference} color={color} />
        </div>
      );
    });
  }

  render() {
    return (
      <div
        ref={ref => {
          this.pdfContainer = ref;
        }}
        style={this.props.style}
      >
        <SelectionHandler
          onTextSelection={this.props.onTextSelection}
          onTextDeselection={this.props.onTextDeselection}
        >
          {(() => {
            const pages = [];
            for (let page = 1; page <= this.state.pdf.numPages; page += 1) {
              pages.push(
                <div className="page-wrapper" key={page}>
                  <SelectionRegion regionId={page.toString()}>
                    <PDFPage
                      onUnload={this.pageUnloaded}
                      onLoading={this.pageLoading}
                      onVisible={this.onPageVisible}
                      onHidden={this.onPageHidden}
                      page={page}
                      pdf={this.state.pdf}
                    >
                      {this.renderReferences(page.toString())}
                    </PDFPage>
                  </SelectionRegion>
                </div>
              );
            }
            return pages;
          })()}
        </SelectionHandler>
      </div>
    );
  }
}

PDF.defaultProps = {
  filename: null,
  onPageChange: () => {},
  onPDFReady: () => {},
  style: {},
  onTextSelection: () => {},
  onTextDeselection: () => {},
  references: Immutable.List(),
  highlightReference: () => {},
  activeReference: '',
};

PDF.propTypes = {
  onPageChange: PropTypes.func,
  onTextSelection: PropTypes.func,
  onTextDeselection: PropTypes.func,
  onPDFReady: PropTypes.func,
  file: PropTypes.string.isRequired,
  filename: PropTypes.string,
  onLoad: PropTypes.func.isRequired,
  pdfInfo: PropTypes.object,
  style: PropTypes.object,
  references: PropTypes.instanceOf(Immutable.List),
  highlightReference: PropTypes.func,
  activeReference: PropTypes.string,
};

export default PDF;
