import { Composition } from "remotion";
import { FPS } from "./lib/timing";
import { shorts } from "./shorts";
import { Welcome } from "./Welcome";

export const Root = () => (
  <>
    {shorts.map((s) => (
      <Composition
        key={s.id}
        id={s.id}
        component={s.component}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(s.duration * FPS)}
      />
    ))}
    {shorts.length === 0 && <Composition id="Welcome" component={Welcome} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 3} />}
  </>
);
