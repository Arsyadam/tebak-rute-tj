import type { FC, ReactNode } from "react"
import "./transitguessr-variables.css"
import styles from "./TransitGuessrHero.module.css"
import { RoomPinInput } from "@/components/landing/RoomPinInput"

interface TransitGuessrHeroProps {
  startCard?: ReactNode
  pinValue?: string
  pinError?: string | null
  pinDisabled?: boolean
  onPinChange?: (code: string) => void
  onPinComplete?: (code: string) => void
  onClearPinError?: () => void
  onLoginClick?: () => void
  onSignUpClick?: () => void
}

const TransitGuessrHero: FC<TransitGuessrHeroProps> = ({
  startCard,
  pinValue,
  pinError,
  pinDisabled,
  onPinChange,
  onPinComplete,
  onClearPinError,
  onLoginClick,
  onSignUpClick,
}) => {
  return (
    <section className={styles.heroRoot}>
      <div className={styles.heroBackdrop} aria-hidden="true">
        <div className={styles.backdropGlowA} />
        <div className={styles.backdropGlowB} />
        <img className={styles.sceneLeft} src="/applyse/Image3@2x.png" alt="" />
        <img className={styles.sceneTrain} src="/applyse/Image10@2x.png" alt="" />
        <img className={styles.sceneRight} src="/applyse/Image15@2x.png" alt="" />
      </div>

      <div className={styles.heroInner}>
        <header className={styles.heroNav}>
          <div className={styles.navBrand}>
            <span className={styles.navMark} aria-hidden="true" />
            TransitGuessr
          </div>
          <nav className={styles.navLinks} aria-label="Primary">
            <span>Vision</span>
            <span>Modes</span>
            <span>Leaderboard</span>
          </nav>
          <div className={styles.navRight}>
            {onPinComplete ? (
              <RoomPinInput
                value={pinValue}
                disabled={pinDisabled}
                error={pinError}
                onChange={onPinChange}
                onComplete={onPinComplete}
                onClearError={onClearPinError}
              />
            ) : null}
            <button type="button" className={styles.navGhostBtn} onClick={onLoginClick}>
              Log in
            </button>
            <button type="button" className={styles.navPrimaryBtn} onClick={onSignUpClick}>
              Sign up
            </button>
          </div>
        </header>

        <div className={styles.leftPanel}>
          <h1 className={styles.title}>
            GeoGuessr but for{" "}
            <span className={styles.titleAccent}>public transport</span>
          </h1>
          <p className={styles.subtitle}>
            Tebak rute, halte, dan perjalanan Jakarta - bareng teman atau solo.
          </p>
        </div>

        <div className={styles.rightPanel}>{startCard}</div>
      </div>
    </section>
  )
}

export default TransitGuessrHero
