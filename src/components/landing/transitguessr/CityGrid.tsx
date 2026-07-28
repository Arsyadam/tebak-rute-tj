import type { FC } from "react";
import styles from "./CityGrid.module.css";

export type Container2Type = {
  className?: string;
  container: string;
};

const Container2: FC<Container2Type> = ({
  className = "",
  container,
}) => {
  return (
    <div className={[styles.container, className].join(" ")}>
      <div className={styles.container2}>
        <div className={styles.container3}>
          <div className={styles.container4}>
            <div className={styles.icon} />
          </div>
          <div className={styles.paragraph}>
            <div className={styles.montreal}>Montreal</div>
          </div>
        </div>
        <div className={styles.container5}>
          <div className={styles.container6}>
            <div className={styles.icon2} />
          </div>
          <div className={styles.paragraph}>
            <div className={styles.montreal}>Austin</div>
          </div>
        </div>
        <div className={styles.container7}>
          <div className={styles.container8}>
            <div className={styles.icon3} />
          </div>
          <div className={styles.paragraph}>
            <div className={styles.montreal}>toronto</div>
          </div>
        </div>
        <div className={styles.container9}>
          <img className={styles.containerIcon}
            width={177}
            height={40}
            alt=""
            src={container} />
          <div className={styles.paragraph}>
            <div className={styles.montreal}>santa monica</div>
          </div>
        </div>
        <div className={styles.container10}>
          <div className={styles.container11}>
            <div className={styles.icon2} />
          </div>
          <div className={styles.paragraph5}>
            <div className={styles.orangeCounty}>orange county</div>
          </div>
        </div>
        <div className={styles.container12}>
          <div className={styles.container13}>
            <div className={styles.icon5} />
          </div>
          <div className={styles.paragraph}>
            <div className={styles.montreal}>connecticut</div>
          </div>
        </div>
        <div className={styles.container14}>
          <img className={styles.containerIcon2}
            width={84}
            height={40}
            alt=""
            src="/applyse/Container3@2x.png" />
          <div className={styles.paragraph}>
            <div className={styles.montreal}>miami</div>
          </div>
        </div>
        <div className={styles.container15}>
          <div className={styles.container16}>
            <div className={styles.icon6} />
          </div>
          <div className={styles.paragraph}>
            <div className={styles.montreal}>Baltimore</div>
          </div>
        </div>
        <div className={styles.container17}>
          <div className={styles.container18}>
            <div className={styles.icon3} />
          </div>
          <div className={styles.paragraph}>
            <div className={styles.montreal}>columbus</div>
          </div>
        </div>
        <div className={styles.container19}>
          <div className={styles.container20}>
            <div className={styles.icon6} />
          </div>
          <div className={styles.paragraph}>
            <div className={styles.montreal}>chicagoLAND</div>
          </div>
        </div>
        <div className={styles.container21}>
          <div className={styles.container22}>
            <div className={styles.icon9} />
          </div>
          <div className={styles.paragraph}>
            <div className={styles.montreal}>ottawa</div>
          </div>
        </div>
        <div className={styles.container23}>
          <div className={styles.container24}>
            <div className={styles.icon10} />
          </div>
          <div className={styles.paragraph}>
            <div className={styles.montreal}>TWIN CITIES</div>
          </div>
        </div>
        <div className={styles.container25}>
          <div className={styles.container26}>
            <div className={styles.icon} />
          </div>
          <div className={styles.paragraph5}>
            <div className={styles.orangeCounty}>las vegas</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Container2;
