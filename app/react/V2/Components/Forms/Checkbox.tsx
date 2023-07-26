import React, { ReactEventHandler } from 'react';
import { Checkbox as FlowbiteCheckbox, Label } from 'flowbite-react';
import { isString } from 'lodash';
import { Translate } from 'app/I18N';
import { Option } from './SelectTypes';

interface CheckboxProps {
  name: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
  defaultChecked?: boolean;
  label: string;
  className?: string;
  disabled?: boolean;
}

const Checkbox = ({
  name,
  onChange,
  className,
  disabled,
  defaultChecked,
  label,
}: CheckboxProps) => (
  <div className="tw-content">
    <fieldset className={`flex flex-wrap gap-4 ${className}`} id={`radio_${name}`}>
      <div className={`flex items-center gap-2 mr-4`}>
        <FlowbiteCheckbox
          id={name}
          name={name}
          disabled={disabled || false}
          defaultChecked={defaultChecked || false}
          onChange={onChange}
        />
        <Label
          htmlFor={name}
          className={`text-sm font-medium text-gray-900 ${disabled ? '!text-gray-300' : ''}`}
        >
          {isString(label) ? <Translate>{label}</Translate> : label}
        </Label>
      </div>
    </fieldset>
  </div>
);

export { Checkbox };
