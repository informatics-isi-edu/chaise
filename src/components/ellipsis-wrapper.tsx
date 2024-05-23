import { useEffect, useState } from "react"
import { useWatch } from "react-hook-form"
import useRecordedit from "../hooks/recordedit"
import ChaiseTooltip from "./tooltip"



export type EllipsisWrapperProps = {
  children: JSX.Element
  /**
   * the typename of the input
   */
  inputType: string
  /**
   * the name of the field for react hook form
   */
  inputName: string
  /**
   * the name of the field for attaching a specific class to input-switch-container and the input
   */
  inputClassName: string
  /**
   * List of additional tooltips to be shown apart from the behavior exhibited by this component
   */
  additionalTooltips?: string[]
}

const EllipsisWrapper = ({
  children,
  inputType,
  inputName,
  inputClassName,
  additionalTooltips
}: EllipsisWrapperProps) => {

  const [showToolTip, setShowTooltip] = useState<boolean>(false);
  const [tooltip, setTooltip] = useState('tooltip');

  const inputFieldValue = useWatch({ name: inputName });
  const { forms } = useRecordedit();

  useEffect(() => {
    const valueDiv = document.querySelector(`.input-switch-container-${inputClassName} .ellipsis`) as HTMLElement;
    let tt = [];

    if (valueDiv && inputFieldValue && valueDiv.clientWidth < valueDiv.scrollWidth) {
      tt.push((inputType === 'file' ? inputFieldValue.filename : inputFieldValue));
    }

    if (additionalTooltips && additionalTooltips.length) {
      for (let additionalTooltip of additionalTooltips) {
        if (!tt.includes(additionalTooltip)) {
          tt.push(additionalTooltip)
        }
      }
    }

    if (tt.length) {
      let tooltipString = '- '+ tt.reduce((prev, curr) => prev + '\n- ' + curr).trim();

      setTooltip(tooltipString);
      setShowTooltip(true);
    } else {
      setShowTooltip(false);
    }

  }, [inputFieldValue, forms])

  return (
    showToolTip ?
      <ChaiseTooltip
        tooltip={tooltip}
        placement={'top-start'}
      >
        {children}
      </ChaiseTooltip>
      :
      children
  );
}

export default EllipsisWrapper;