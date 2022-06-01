import '@isrd-isi-edu/chaise/src/assets/scss/_resizable.scss';

import { useRef, useEffect, useState } from 'react';
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';


// const min_width = 250;

// const initial_width = 270;

// const max_width = 450;

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

            fireCustomEvent('resizable-filter-width-change', '.split-view', { width: leftWidth });
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