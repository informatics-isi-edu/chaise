import OverlayTrigger, { OverlayTriggerType } from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import { Placement } from 'react-bootstrap/types';
import { IS_DEV_MODE } from '@isrd-isi-edu/chaise/src/utils/constants';

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
   * The class name that will be attached to the tooltip
   * (can be used for applying custom styles to the tooltip)
   */
  className?: string,
  /**
   * if you want to manually control the tooltip, use
   * this property in combination with `onToggle`.
   * You should make sure `show` is set to proper value in that callback.
   */
  show?: boolean,
  /**
   * if you want to manually control the tooltip, use
   * this property in combination with `show`.
   * You should make sure `show` is set to proper value in this callback.
   */
  onToggle?: (nextShow: boolean) => void,
  /**
   * whether the text is dynamic and we should remount the tooltip when its content changes.
   * This must be used with dynamic tooltips that change while user is still seeing the tooltip. without it the tooltip
   * will be misaligned and might even go over the edge of the window.
   */
  dynamicTooltipString?: boolean
}


const ChaiseTooltip = ({
  tooltip,
  children,
  placement,
  className,
  show,
  onToggle,
  dynamicTooltipString
}: ChaiseTooltipProps): JSX.Element => {
  /**
   * - in react-bootstrap, the focus on the buttons remains even in cases where
   *   we're opening a popup. the button blurs only if you click somewhere else.
   *   so if we define the trigger for the tooltips as `focus`, the tooltip will
   *   stay on the page until you click somewhere on the page.
   *
   * - react-bootstrap doesn't like when we're removing the `focus` from the trigger
   *   and constantly shows a console warning in dev mode
   *   https://github.com/react-bootstrap/react-bootstrap/issues/5027
   *
   * that's why, only in production, we're removing the `focus` to make sure tooltips
   * are not always displayed after button click.
   *
   * TODO we might want to explore better ways to handle this. ideally we should find
   * a way to automatically blur the buttons, or manually do it for the cases where we also have tooltip
   */
  const trigger: OverlayTriggerType[] = ['hover'];
  if (IS_DEV_MODE) {
    trigger.push('focus');
  }

  return (
    <OverlayTrigger
      trigger={trigger}
      show={show}
      onToggle={onToggle}
      placement={placement}
      overlay={
        <Tooltip
          className={className}
          /**
           * adding the tooltip as key will make sure we're remounting when tooltip changes.
           * we have to remount so the tooltip position is updated properly
           */
          {...(dynamicTooltipString && typeof tooltip === 'string' && { key: tooltip })}
        >
          {tooltip}
        </Tooltip>
      }
    >
      {children}
    </OverlayTrigger>
  )
};

export default ChaiseTooltip;
