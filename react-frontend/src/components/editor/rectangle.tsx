import { PixiComponent } from "@pixi/react";
import { Graphics } from "pixi.js";

interface RectangleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  zIndex?: number;
}

const Rectangle = PixiComponent<RectangleProps, Graphics>('Rectangle', {
  create: () => new Graphics(),
  applyProps: (ins, _, props) => {
    ins.zIndex = props.zIndex ?? 0;
    ins.x = props.x;
    ins.beginFill(props.color);
    ins.drawRect(props.x, props.y, props.width, props.height);
    ins.endFill();
  },
});