import '@isrd-isi-edu/chaise/src/assets/scss/_resizable.scss';
import { useRef, useEffect, useState } from 'react';
import { fireCustomEvent, convertVWToPixel } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

/* 
Component Usage:
    This component is used to implement a horizontal dragable and resizable component/div

Props:
    left - the left-pane component in the resizable layout
    right - the right-pane component in the resizable layout
    className - to apply custom styles on the component
    minWidth - the minimum width limit on the left-pane component | defaults to 250px
    maxWidth - the maximum width limit on the left-pane component | defaults to 450px
    initialWidth - the initial width for the left-pane component | defaults to 270px
    convertMaxWidth - use this flag in case you pass maxWidth in vw units instead of px units

Note:
    To resize other components based on the resized value left-pane component add an event listener and listen to the 
    'resizable-width-change' event.

    For usage refer to the recordset.tsx component
*/

type LeftPaneProps = {
    children: (ref: React.RefObject<HTMLDivElement>) => JSX.Element,
    leftWidth: number | undefined,
};

const LeftPane = ({ children, leftWidth }: LeftPaneProps): JSX.Element => {
    const leftRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (leftRef?.current) {
            fireCustomEvent('resizable-width-change', '.split-view', { width: leftWidth });
            leftRef.current.style.width = `${leftWidth}px`;
        }
    }, [leftRef, leftWidth]);

    return children(leftRef);
};

type SplitViewProps = {
    left: (ref: React.RefObject<HTMLDivElement>) => JSX.Element,
    right: React.ReactNode,
    className?: string,
    minWidth?: number,
    maxWidth?: number,
    initialWidth?: number,
    convertMinWidth?: boolean,
    convertMaxWidth?: boolean,
    convertInitialWidth?: boolean
};

type StateDef = {
    leftWidth: number,
    xPos: undefined | number,
    dragging: boolean,
}

const SplitView = ({
    left,
    right,
    className,
    minWidth = 250,
    maxWidth = 450,
    initialWidth = 270,
    convertMinWidth = false,
    convertMaxWidth = false,
    convertInitialWidth = false
}: SplitViewProps): JSX.Element => {

    let convertedMinWidth = minWidth;

    let convertedMaxWidth = maxWidth;

    let convertedInitialWidth = initialWidth;

    if (convertMinWidth) {
        convertedMinWidth = convertVWToPixel(minWidth);
    }

    if (convertMaxWidth) {
        convertedMaxWidth = convertVWToPixel(maxWidth);
    }

    if (convertInitialWidth) {
        convertedInitialWidth = convertVWToPixel(initialWidth);
    }

    const [leftState, setLeftState] = useState<StateDef>({ leftWidth: convertedInitialWidth, xPos: undefined, dragging: false });

    const onMouseDown = (e: React.MouseEvent) => setLeftState({ ...leftState, xPos: e.clientX, dragging: true });

    const onMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        onMove(e.clientX);
    };

    const onMouseUp = () => setLeftState({ ...leftState, dragging: false });

    const onMove = (clientX: number) => {
        if (leftState.dragging && leftState.leftWidth && leftState.xPos) {
            const newLeftWidth = leftState.leftWidth + clientX - leftState.xPos;

            if (newLeftWidth < convertedMinWidth) {
                setLeftState({ ...leftState, leftWidth: convertedMinWidth, xPos: clientX });
                return;
            }

            if (newLeftWidth > convertedMaxWidth) {
                setLeftState({ ...leftState, leftWidth: convertedMaxWidth, xPos: clientX });
                return;
            }

            setLeftState({ ...leftState, leftWidth: newLeftWidth, xPos: clientX });
        }
    };

    useEffect(() => {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    });

    return (
        <div className={`split-view ${className ?? ''}`}>
            <LeftPane leftWidth={leftState.leftWidth}>
                {left}
            </LeftPane>
            <div
                className='divider-hitbox'
                onMouseDown={onMouseDown}
            >
                <span className='fas fa-ellipsis-v' />
            </div>
            {right}
        </div>
    );
};

export default SplitView;