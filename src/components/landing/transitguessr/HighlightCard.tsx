import { useMemo } from "react";
import type { CSSProperties, FC } from "react";
import styles from "./HighlightCard.module.css";

export type Container1Type = {
  className?: string;
  image: string;
  weBroadcastToMoreRiders?: string;
  thousandsOfRidersInYourCity?: string;

  /** Style props */
  containerAlignSelf?: CSSProperties["alignSelf"];
  containerHeight?: CSSProperties["height"];
  containerHeight1?: CSSProperties["height"];
  containerPadding?: CSSProperties["padding"];
};

const Container1: FC<Container1Type> = ({
  className = "",
  containerAlignSelf,
  containerHeight,
  image,
  containerHeight1,
  containerPadding,
  weBroadcastToMoreRiders,
  thousandsOfRidersInYourCity,
}) => {
  const container5Style: CSSProperties = useMemo(() => {
    return {
      alignSelf: containerAlignSelf,
      height: containerHeight,
    };
  }, [containerAlignSelf, containerHeight]);

  const container6Style: CSSProperties = useMemo(() => {
    return {
      height: containerHeight1,
      padding: containerPadding,
    };
  }, [containerHeight1, containerPadding]);

  return (
    <section
      className={[styles.container, className].join(" ")}
      style={container5Style}
    >
      <img className={styles.imageIcon}
        width={280}
        height={100}
        alt=""
        src={image} />
      <div className={styles.container2} style={container6Style}>
        <h3 className={styles.weBroadcastTo}>{weBroadcastToMoreRiders}</h3>
        <div className={styles.thousandsOfRiders}>
          {thousandsOfRidersInYourCity}
        </div>
      </div>
    </section>
  );
};

export default Container1;
