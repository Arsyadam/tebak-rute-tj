import { useMemo } from "react";
import type { CSSProperties, FC } from "react";
import styles from "./ArticleCard.module.css";

export type LinkType = {
  className?: string;
  image: string;
  jun82026?: string;
  tTCAndTransitAppAreTeaming?: string;

  /** Style props */
  tTCAndTransitHeight?: CSSProperties["height"];
};

const Link: FC<LinkType> = ({
  className = "",
  image,
  jun82026,
  tTCAndTransitAppAreTeaming,
  tTCAndTransitHeight,
}) => {
  const tTCAndTransitStyle: CSSProperties = useMemo(() => {
    return {
      height: tTCAndTransitHeight,
    };
  }, [tTCAndTransitHeight]);

  return (
    <section className={[styles.link, className].join(" ")}>
      <img className={styles.imageIcon}
        width={316}
        height={180}
        alt=""
        src={image} />
      <div className={styles.paragraph}>
        <div className={styles.jun82026}>{jun82026}</div>
      </div>
      <h3 className={styles.ttcAndTransit} style={tTCAndTransitStyle}>
        {tTCAndTransitAppAreTeaming}
      </h3>
    </section>
  );
};

export default Link;
