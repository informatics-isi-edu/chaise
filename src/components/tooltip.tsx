import { Placement } from 'react-bootstrap/types';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

type ChaiseTooltipProps = {
  /**
   * The displayed tooltip.
   */
  tooltip: string | JSX.Element,
  /**
   * where the tooltip should be
   */
  placement: Placement,
  /**
   * The inner element
   */
  children: JSX.Element,
  /**
   * Whether we want the tooltip to always be on left
   */
   tooltipAlwaysOnLeft?: boolean,
}


const ChaiseTooltip = ({
  tooltip,
  children,
  placement,
  tooltipAlwaysOnLeft,
}: ChaiseTooltipProps): JSX.Element => {
  const className = tooltipAlwaysOnLeft ? 'tooltip-w-arrow-always-on-left' : '';
  return (
    <OverlayTrigger
      placement={placement}
      overlay={
        <Tooltip className={className}>
          {tooltip}
        </Tooltip>
      }
    >
      {children}
    </OverlayTrigger>
  )
};

export default ChaiseTooltip;
