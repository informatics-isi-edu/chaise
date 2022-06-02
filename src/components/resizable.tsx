import '@isrd-isi-edu/chaise/src/assets/scss/_resizable.scss';
import { useRef, useEffect, useState } from 'react';
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

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


const vwToPx = (value: number) => {
    const e = document.documentElement;
    const g = document.getElementsByTagName('body')[0];
    const x = window.innerWidth || e.clientWidth || g.clientWidth;

    const result = (x * value) / 100;
    return result;
}

type LeftPaneProps = {
    children: (ref: React.RefObject<HTMLDivElement>) => JSX.Element,
    leftWidth: number | undefined,
    setLeftWidth: (value: number) => void
};

const LeftPane = ({ children, leftWidth, setLeftWidth }: LeftPaneProps): JSX.Element => {
    const leftRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (leftRef?.current) {
            if (!leftWidth) {
                setLeftWidth(leftRef.current.clientWidth);
                return;
            }

            fireCustomEvent('resizable-width-change', '.split-view', { width: leftWidth });
            leftRef.current.style.width = `${leftWidth}px`;
        }
    }, [leftRef, leftWidth, setLeftWidth]);

    return children(leftRef);
};


type SplitViewProps = {
    left: (ref: React.RefObject<HTMLDivElement>) => JSX.Element,
    right: React.ReactNode,
    className?: string,
    minWidth?: number,
    maxWidth?: number,
    initialWidth?: number,
    convertMaxWidth?: boolean
};

const SplitView = ({
    left,
    right,
    className,
    minWidth = 250,
    maxWidth = 450,
    initialWidth = 270,
    convertMaxWidth = false
}: SplitViewProps): JSX.Element => {
    const [leftWidth, setLeftWidth] = useState<undefined | number>(initialWidth || undefined);
    const [separatorXPosition, setSeparatorXPosition] = useState<undefined | number>(undefined);
    const [dragging, setDragging] = useState(false);
    let convertedMaxWidth = maxWidth;
    if (convertMaxWidth) {
        convertedMaxWidth = vwToPx(maxWidth);
    }

    const onMouseDown = (e: React.MouseEvent) => {
        setSeparatorXPosition(e.clientX);
        setDragging(true);
    };

    const onMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        onMove(e.clientX);
    };

    const onMouseUp = () => {
        setDragging(false);
    };

    const onMove = (clientX: number) => {
        if (dragging && leftWidth && separatorXPosition) {
            const newLeftWidth = leftWidth + clientX - separatorXPosition;
            setSeparatorXPosition(clientX);

            if (newLeftWidth < minWidth) {
                setLeftWidth(minWidth);
                return;
            }

            if (newLeftWidth > convertedMaxWidth) {
                setLeftWidth(convertedMaxWidth);
                return;
            }

            setLeftWidth(newLeftWidth);
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
            <LeftPane leftWidth={leftWidth} setLeftWidth={setLeftWidth}>
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