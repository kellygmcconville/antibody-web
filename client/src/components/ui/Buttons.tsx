// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an LGPL-3.0 license that
// can be found in the LICENSE file distributed with this file.
import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';

export interface ContinueButtonProps {
  text?: string;
  href?: string | undefined;
}

export const ContinueButton: FunctionComponent<ContinueButtonProps> = (
  props: ContinueButtonProps
) => {
  return (
    <Link
      data-testid="primary-button"
      className="nhsuk-button"
      to={props.href ? props.href : ""}>
      {props.text ? props.text : 'Continue'}
    </Link>
  );
};

export const SecondaryButton: FunctionComponent<ContinueButtonProps> = (
  props: ContinueButtonProps
) => {
  return (
    <Link
      className="nhsuk-button nhsuk-button--secondary"
      to={props.href ? props.href : ""}>
      {props.text ? props.text : 'Cancel'}
    </Link>
  );
};
