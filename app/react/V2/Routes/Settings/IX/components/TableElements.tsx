/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { CalculatorIcon, CalendarDaysIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { PropertySchema } from 'shared/types/commonTypes';
import { Button, Pill } from 'app/V2/Components/UI';
import { IXExtractorInfo } from '../types';

interface PropertyTypes extends PropertySchema {
  type: 'text' | 'numeric' | 'date';
}

type TableData = IXExtractorInfo & {
  propertyLabel: string;
  propertyType: PropertyTypes['type'];
};

const propertyIcons = {
  text: <Bars3BottomLeftIcon className="w-5" />,
  numeric: <CalculatorIcon className="w-5" />,
  date: <CalendarDaysIcon className="w-5" />,
};

const columnHelper = createColumnHelper<TableData>();

const ExtractorHeader = () => <Translate>Extractor</Translate>;
const PropertyHeader = () => <Translate>Property</Translate>;
const TemplatesHeader = () => <Translate>Templates</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const PropertyCell = ({ cell }: CellContext<TableData, TableData['propertyType']>) => {
  const property = cell.getValue();
  return (
    <div className="flex gap-2">
      {propertyIcons[property]}
      <p className="text-gray-500">{cell.row.original.propertyLabel}</p>
    </div>
  );
};

const TemplatesCell = ({ cell }: CellContext<TableData, TableData['templates']>) => (
  <div className="flex gap-1">
    {cell.getValue().map(templateName => (
      <div key={templateName} className="whitespace-nowrap">
        <Pill color="gray">{templateName}</Pill>
      </div>
    ))}
  </div>
);

const LinkButton = ({ cell }: CellContext<TableData, TableData['_id']>) => (
  <Link to={`suggestions/${cell.getValue()}`}>
    <Button className="leading-4" styling="outline">
      <Translate>Review</Translate>
    </Button>
  </Link>
);

const tableColumns = [
  columnHelper.accessor('name', {
    header: ExtractorHeader,
    meta: { className: '' },
  }),
  columnHelper.accessor('propertyType', {
    header: PropertyHeader,
    cell: PropertyCell,
    meta: { className: '' },
  }),
  columnHelper.accessor('templates', {
    header: TemplatesHeader,
    enableSorting: false,
    cell: TemplatesCell,
    meta: { className: '' },
  }),
  columnHelper.accessor('_id', {
    header: ActionHeader,
    enableSorting: false,
    cell: LinkButton,
    meta: { className: 'w-0 text-center' },
  }),
];

export type { TableData };
export { tableColumns };
