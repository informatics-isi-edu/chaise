import { Placement } from 'react-bootstrap/types';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

type ChaiseTooltipProps = {
  tooltip: string | JSX.Element,
  placement: Placement,
  children: JSX.Element
}


const ChaiseTooltip = ({
  tooltip,
  children,
  placement
}: ChaiseTooltipProps) : JSX.Element => {

  return (
    <OverlayTrigger
      placement={placement}
      overlay={<Tooltip>{tooltip}</Tooltip>}
    >
      {children}
    </OverlayTrigger>
  )
};

export default ChaiseTooltip;
