import { useMemo } from "react";
import type { CSSProperties, FC } from "react";
import styles from "./FeatureCard.module.css";

export type ContainerType = {
  className?: string;
  yourDataIsNotOurBusiness?: string;
  weDontLinkYourLocationHistory?: string;
  privacyAtTransit?: string;

  /** Style props */
  containerHeight?: CSSProperties["height"];
  containerBackground?: CSSProperties["background"];
  containerPadding?: CSSProperties["padding"];
  containerHeight1?: CSSProperties["height"];
  iconHeight?: CSSProperties["height"];
  containerHeight2?: CSSProperties["height"];
  linkWidth?: CSSProperties["width"];
};

const Container: FC<ContainerType> = ({
  className = "",
  containerHeight,
  containerBackground,
  containerPadding,
  containerHeight1,
  iconHeight,
  containerHeight2,
  yourDataIsNotOurBusiness,
  weDontLinkYourLocationHistory,
  linkWidth,
  privacyAtTransit,
}) => {
  const containerStyle: CSSProperties = useMemo(() => {
    return {
      height: containerHeight,
    };
  }, [containerHeight]);

  const container1Style: CSSProperties = useMemo(() => {
    return {
      background: containerBackground,
    };
  }, [containerBackground]);

  const container2Style: CSSProperties = useMemo(() => {
    return {
      padding: containerPadding,
    };
  }, [containerPadding]);

  const container3Style: CSSProperties = useMemo(() => {
    return {
      height: containerHeight1,
    };
  }, [containerHeight1]);

  const iconStyle: CSSProperties = useMemo(() => {
    return {
      height: iconHeight,
    };
  }, [iconHeight]);

  const container4Style: CSSProperties = useMemo(() => {
    return {
      height: containerHeight2,
    };
  }, [containerHeight2]);

  const linkStyle: CSSProperties = useMemo(() => {
    return {
      width: linkWidth,
    };
  }, [linkWidth]);

  return (
    <div
      className={[styles.container, className].join(" ")}
      style={containerStyle}
    >
      <div className={styles.container2} style={container1Style}>
        <div className={styles.container3} style={container2Style}>
          <div className={styles.container4} style={container3Style}>
            <div className={styles.icon} style={iconStyle} />
          </div>
        </div>
      </div>
      <div className={styles.container5} style={container4Style}>
        <div className={styles.heading3}>
          <h3 className={styles.yourDataIs}>{yourDataIsNotOurBusiness}</h3>
        </div>
        <div className={styles.paragraph}>
          <div className={styles.weDontLink}>
            {weDontLinkYourLocationHistory}
          </div>
        </div>
        <div className={styles.link} style={linkStyle}>
          <b className={styles.privacyAtTransit}>{privacyAtTransit}</b>
          <div className={styles.text} />
        </div>
      </div>
    </div>
  );
};

export default Container;
