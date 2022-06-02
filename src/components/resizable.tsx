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
    min_width - the minimum width limit on the left-pane component | defaults to 250px
    max_width - the maximum width limit on the left-pane component | defaults to 450px
    initial_width - the initial width for the left-pane component | defaults to 270px

Note:
    To resize other components based on the resized value left-pane component add an event listener and listen to the 
    'resizable-width-change' event.

    For usage refer to the recordset.tsx component
*/

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
    min_width?: number,
    max_width?: number,
    initial_width?: number
};

const SplitView = ({
    left,
    right,
    className,
    min_width = 250,
    max_width = 450,
    initial_width = 270,
}: SplitViewProps): JSX.Element => {
    const [leftWidth, setLeftWidth] = useState<undefined | number>(initial_width || undefined);
    const [separatorXPosition, setSeparatorXPosition] = useState<undefined | number>(undefined);
    const [dragging, setDragging] = useState(false);

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

            if (newLeftWidth < min_width) {
                setLeftWidth(min_width);
                return;
            }

            if (newLeftWidth > max_width) {
                setLeftWidth(max_width);
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
                <div className='divider' />
            </div>
            {right}
        </div>
    );
};

export default SplitView;