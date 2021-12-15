/**
 * @jest-environment jest-environment-jsdom-sixteen
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Immutable from 'immutable';
import { FileType } from 'shared/types/fileType';
import { renderConnectedContainer, defaultState } from 'app/utils/test/renderConnected';
import socket from 'app/socket';
import { OCRDisplay } from '../OCRDisplay';
import * as ocrActions from '../../actions/ocrActions';
import * as documentActions from '../../actions/documentActions';

describe('OCRDisplay', () => {
  let file: FileType;
  let store: any;

  let mockSocketOn: any = {};

  jest.spyOn(socket, 'on').mockImplementation((event: string, callback: any) => {
    mockSocketOn[event] = callback;
  });

  jest.spyOn(documentActions, 'reloadDocument').mockReturnValue(async () => Promise.resolve());

  jest.spyOn(ocrActions, 'postToOcr').mockResolvedValue();
  jest.spyOn(ocrActions, 'getOcrStatus').mockImplementation(async filename =>
    Promise.resolve({
      status: filename,
      lastUpdated: 1000,
    })
  );

  beforeEach(() => {
    jest.clearAllMocks();
    file = { _id: 'file_id', filename: 'noOCR' };
    store = { ...defaultState };
  });

  const render = (toggleOCRButton: boolean, pdf: FileType) => {
    const reduxStore = {
      ...store,
      settings: {
        collection: Immutable.fromJS({ toggleOCRButton }),
      },
    };
    renderConnectedContainer(<OCRDisplay file={pdf} />, () => reduxStore);
  };

  it('should not try to get the status if the feature is not toggled on', async () => {
    render(false, file);
    expect(ocrActions.getOcrStatus).not.toHaveBeenCalled();
  });

  describe('rendering', () => {
    it('should first render with a loading OCR message', async () => {
      render(true, file);
      expect(await screen.findByText('Loading')).not.toBeNull();
    });
  });

  describe('status', () => {
    it('should render according to the pdf OCR status', async () => {
      file = { filename: 'withOCR' };
      render(true, file);
      expect(await screen.findByText('OCR')).not.toBeNull();
    });

    it('should render the date with the last update', async () => {
      file = { filename: 'inQueue' };
      render(true, file);
      expect(
        await screen.findByText(`Last updated: ${new Date(1000).toLocaleString('en')}`)
      ).not.toBeNull();
    });

    it('should have localization for the last update date format', async () => {
      file = { filename: 'inQueue' };
      store.locale = 'es';
      render(true, file);
      expect(
        await screen.findByText(`Last updated: ${new Date(1000).toLocaleString('es')}`)
      ).not.toBeNull();
    });

    it('should render a button if the file has no OCR', async () => {
      render(true, file);
      expect((await screen.findByRole('button')).textContent).toBe('OCR PDF');
    });

    describe('adding to ocr queue', () => {
      it('should trigger the OCR service when clicking the button', async () => {
        render(true, file);
        const ocrButton: Element = await screen.findByRole('button');
        fireEvent.click(ocrButton);
        expect(ocrActions.postToOcr).toHaveBeenCalledWith(file.filename);
      });

      it('should change to show the file is in the queue inmediatly', async () => {
        render(true, file);
        const ocrButton: Element = await screen.findByRole('button');
        fireEvent.click(ocrButton);
        expect(await screen.findByText('In OCR queue')).not.toBeNull();
      });
    });
  });

  describe('sockets', () => {
    const renderAndSubmit = async () => {
      render(true, file);
      const ocrButton: Element = await screen.findByRole('button');
      fireEvent.click(ocrButton);

      await new Promise<void>(resolve => {
        setImmediate(() => {
          resolve();
        });
      });
    };

    it('should listen for the ocr service on submit', async () => {
      await renderAndSubmit();
      expect(socket.on).toHaveBeenCalled();
    });

    it('should change to display that the ocr is done when the service reports', async () => {
      await renderAndSubmit();
      act(() => {
        mockSocketOn['ocr:ready']('file_id');
      });
      expect(await screen.findByText('OCR completed')).not.toBeNull();
    });

    it('should change to display that the ocr has failed when the service reports', async () => {
      await renderAndSubmit();
      act(() => {
        mockSocketOn['ocr:error']('file_id');
      });
      expect(await screen.findByText('Could not be processed')).not.toBeNull();
    });

    it('should liste to the ocr service if the document is in queue', async () => {
      render(true, { ...file, filename: 'inQueue' });
      expect(await screen.findByText('In OCR queue')).not.toBeNull();
      expect(socket.on).toHaveBeenCalled();
    });
  });
});
