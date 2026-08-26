import { basePastelColors } from "../colors";

type ColorListProps = {
  onClickColor: (color: string) => void;
  className?: string;
};

function ColorList(props: ColorListProps) {
  return (
    <div className={props.className}>
      {[...basePastelColors].map((color) => (
        <button
          key={color}
          className="h-5 w-5 rounded-full cursor-pointer hover:scale-110"
          style={{ background: color }}
          onClick={() => props.onClickColor(color)}
        />
      ))}
    </div>
  );
}

export default ColorList;
