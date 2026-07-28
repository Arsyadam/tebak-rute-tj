import { useState } from "react";
import type { FC } from "react";
import type { ReactNode } from "react";
import FeatureCard from "./FeatureCard";
import HighlightCard from "./HighlightCard";
import CityGrid from "./CityGrid";
import ArticleCard from "./ArticleCard";
import "./transitguessr-variables.css";
import styles from "./TransitGuessrHero.module.css";

interface TransitGuessrHeroProps {
  startCard?: ReactNode
  sideCard?: ReactNode
}

const TransitGuessrHero: FC<TransitGuessrHeroProps> = ({ startCard, sideCard }) => {
  const [linkItems] = useState([
    {
      image: "/applyse/Image1@2x.png",
      jun82026: "Tips",
      tTCAndTransitAppAreTeaming: "Pahami warna koridor BRT Transjakarta",
      tTCAndTransitHeight: "63px" as const,
    },
    {
      image: "/applyse/Image9@2x.png",
      jun82026: "Fakta",
      tTCAndTransitAppAreTeaming: "KRL Commuter Line melayani jutaan penumpang setiap hari",
      tTCAndTransitHeight: "63px" as const,
    },
    {
      image: "/applyse/Image4@2x.png",
      jun82026: "Tips",
      tTCAndTransitAppAreTeaming: "Tebak halte berdasarkan urutan pemberhentian rute",
      tTCAndTransitHeight: "63px" as const,
    },
  ]);
  const [linkItems1] = useState([
    {
      image: "/applyse/Image12@2x.png",
      jun82026: "Fakta",
      tTCAndTransitAppAreTeaming:
        "MRT Jakarta membentang dari Lebak Bulus hingga Bundaran HI",
      tTCAndTransitHeight: undefined,
    },
    {
      image: "/applyse/Image20@2x.png",
      jun82026: "Tips",
      tTCAndTransitAppAreTeaming: "Gunakan mode plan-trip untuk merancang rute ideal",
      tTCAndTransitHeight: undefined,
    },
    {
      image: "/applyse/Image23@2x.png",
      jun82026: "Fakta",
      tTCAndTransitAppAreTeaming:
        "LRT Jabodebek menghubungkan Jakarta dengan kota-kota sekitarnya",
      tTCAndTransitHeight: "94px" as const,
    },
    {
      image: "/applyse/Image21@2x.png",
      jun82026: "Tips",
      tTCAndTransitAppAreTeaming:
        "Ajak teman dan buat room multiplayer untuk kompetisi seru",
      tTCAndTransitHeight: "94px" as const,
    },
    {
      image: "/applyse/Image11@2x.png",
      jun82026: "Fakta",
      tTCAndTransitAppAreTeaming: "Data GTFS memastikan informasi rute akurat",
      tTCAndTransitHeight: undefined,
    },
  ]);
  return (
    <div className={styles.transitTheBestAppForBus}>
      <main className={styles.body}>
        <section className={styles.header}>
          <div className={styles.container} />
          <div className={styles.placeholderForContainer} />
          <div className={styles.container2}>
            <section className={styles.container3}>
              <div className={styles.container4}>
                <img className={styles.imageIcon}
                  width={158}
                  height={200}
                  alt=""
                  src="/applyse/Image3@2x.png" />
              </div>
              <div className={styles.container5}>
                <div className={styles.container6}>
                  <img className={styles.imageIcon2}
                    width={120}
                    height={113}
                    alt=""
                    src="/applyse/Image7@2x.png" />
                  <img className={styles.containerIcon}
                    width={111.5}
                    height={57}
                    alt=""
                    src="/applyse/Container@2x.png" />
                </div>
              </div>
              <div className={styles.container5}>
                <img className={styles.imageIcon3}
                  width={132}
                  height={136}
                  alt=""
                  src="/applyse/Image17@2x.png" />
              </div>
              <div className={styles.container4}>
                <img className={styles.imageIcon4}
                  width={93}
                  height={104}
                  alt=""
                  src="/applyse/Image13@2x.png" />
                <div className={styles.container9}>
                  <div className={styles.container10}>
                    <div className={styles.icon} />
                  </div>
                </div>
              </div>
              <img className={styles.imageIcon5}
                width={362}
                height={264}
                alt=""
                src="/applyse/Image15@2x.png" />
              <div className={styles.container5}>
                <img className={styles.imageIcon6}
                  width={453}
                  height={120}
                  alt=""
                  src="/applyse/Image10@2x.png" />
              </div>
              <div className={styles.container5}>
                <img className={styles.imageIcon7}
                  width={158}
                  height={200}
                  alt=""
                  src="/applyse/Image3@2x.png" />
              </div>
            </section>
            <section className={styles.container13}>
              <img className={styles.containerIcon2}
                width={799.3}
                height={799.3}
                alt=""
                src="/applyse/Container7.svg" />
              <div className={styles.container14}>
                <div className={styles.image}>
                  <div className={styles.group}>
                    <img className={styles.svgElementIcon}
                      width={95}
                      height={96.7}
                      alt=""
                      src="/applyse/Svg-Element.svg" />
                    <img className={styles.svgShapeIcon}
                      width={47.3}
                      height={29.8}
                      alt=""
                      src="/applyse/Svg-Shape.svg" />
                    <img className={styles.pathElementIcon}
                      width={38.1}
                      height={23.4}
                      alt=""
                      src="/applyse/Svg-Shape.svg" />
                    <img className={styles.svgPartIcon}
                      width={43.1}
                      height={67.2}
                      alt=""
                      src="/applyse/Svg-Part.svg" />
                    <img className={styles.drawingPartIcon}
                      width={5}
                      height={5}
                      alt=""
                      src="/applyse/Drawing-Part.svg" />
                    <img className={styles.shapeElementIcon}
                      width={5}
                      height={5}
                      alt=""
                      src="/applyse/Drawing-Part.svg" />
                    <img className={styles.graphicPartIcon}
                      width={5}
                      height={5}
                      alt=""
                      src="/applyse/Drawing-Part.svg" />
                    <img className={styles.vectorIcon}
                      width={5}
                      height={5}
                      alt=""
                      src="/applyse/Drawing-Part.svg" />
                    <img className={styles.arcElementIcon}
                      width={5}
                      height={5}
                      alt=""
                      src="/applyse/Drawing-Part.svg" />
                    <img className={styles.vectorIcon2}
                      width={5}
                      height={5}
                      alt=""
                      src="/applyse/Drawing-Part.svg" />
                    <img className={styles.circleElementIcon}
                      width={5}
                      height={5}
                      alt=""
                      src="/applyse/Drawing-Part.svg" />
                    <div className={styles.group2}>
                      <img className={styles.smallShapeIcon}
                        width={34}
                        height={34}
                        alt=""
                        src="/applyse/Drawing-Part.svg" />
                      <img className={styles.miniShapeIcon}
                        width={38.3}
                        height={38.3}
                        alt=""
                        src="/applyse/Drawing-Part.svg" />
                      <img className={styles.tinyShapeIcon}
                        width={34}
                        height={34}
                        alt=""
                        src="/applyse/Drawing-Part.svg" />
                      <img className={styles.abstractShapeIcon}
                        width={16.3}
                        height={14.9}
                        alt=""
                        src="/applyse/Abstract-Shape.svg" />
                      <img className={styles.fineShapeIcon}
                        width={7.6}
                        height={3.6}
                        alt=""
                        src="/applyse/Fine-Shape.svg" />
                      <img className={styles.groupIcon}
                        width={22.7}
                        height={22.7}
                        alt=""
                        src="/applyse/Group1@2x.png" />
                      <div className={styles.div}>🦁</div>
                      <img className={styles.groupIcon2}
                        width={22.7}
                        height={22.7}
                        alt=""
                        src="/applyse/Group2.svg" />
                    </div>
                    <img className={styles.groupIcon3}
                      width={23}
                      height={29}
                      alt=""
                      src="/applyse/Group.svg" />
                    <img className={styles.vectorIcon3}
                      width={6.9}
                      height={6.9}
                      alt=""
                      src="/applyse/Vector.svg" />
                    <img className={styles.vectorIcon4}
                      width={14}
                      height={14}
                      alt=""
                      src="/applyse/Vector1@2x.png" />
                  </div>
                </div>
              </div>
              <div className={styles.container15}>
                <img className={styles.imageIcon8}
                  width={461}
                  height={320}
                  alt=""
                  src="/applyse/Image6@2x.png" />
              </div>
              <div className={styles.container16}>
                <div className={styles.container17} />
                <div className={styles.container18} />
              </div>
              <div className={styles.container15}>
                <img className={styles.imageIcon9}
                  width={224}
                  height={184}
                  alt=""
                  src="/applyse/Image19@2x.png" />
              </div>
            </section>
          </div>
          <header className={styles.navigation}>
            <div className={styles.logoText}>TransitGuessr</div>
            <div className={styles.container20}>
              <div className={styles.container21}>
                <div className={styles.english}>English</div>
              </div>
              <div className={styles.container22}>
                <img className={styles.icon2}
                  width={13}
                  height={13}
                  alt=""
                  src="/applyse/Icon.svg" />
              </div>
            </div>
            <nav className={styles.container23}>
              <div className={styles.link}>
                <div className={styles.paragraph}>
                  <div className={styles.vision}>Vision</div>
                </div>
              </div>
              <div className={styles.link2}>
                <div className={styles.paragraph}>
                  <div className={styles.regions}>Regions</div>
                </div>
              </div>
              <div className={styles.link3}>
                <div className={styles.container24}>
                  <div className={styles.paragraph3}>
                    <div className={styles.regions}>Partners</div>
                  </div>
                </div>
              </div>
              <div className={styles.link4}>
                <div className={styles.paragraph}>
                  <div className={styles.regions}>Tips</div>
                </div>
              </div>
            </nav>
          </header>
          <section className={styles.container25}>
            <div className={styles.heading1}>
              <h1 className={styles.yourLicenseToContainer}>
                <span className={styles.yourLicenseToA}>Tebak rute.</span>
                <span className={styles.carFree}>Tebak halte.</span>
                <span className={styles.yourLicenseToA}>Rebut skor tertinggi.</span>
              </h1>
            </div>
            <div className={styles.heading2}>
              <h3 className={styles.ourAppMakes}>
                Game edukasi dari data GTFS Transjakarta, KRL, MRT,
                <br />
                dan LRT Jabodebek / Jabodetabek. Warna jalur sama kayak aslinya.
              </h3>
            </div>
            <div className={styles.container26} />
            {startCard ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                <div>{startCard}</div>
                <div>{sideCard}</div>
              </div>
            ) : null}
          </section>
        </section>
        <main className={styles.section}>
          <div className={styles.container28}>
            <div className={styles.container29}>
              <div className={styles.container30}>
                <div className={styles.container31}>
                  <section className={styles.container32}>
                    <div className={styles.heading22}>
                      <h1 className={styles.allTheBuses}>
                        Tebak rute
                        <br />
                        tanpa ribet
                      </h1>
                    </div>
                    <div className={styles.paragraph6}>
                      <div className={styles.seeAllNearby}>
                        Pilih mode: tebak rute, tebak halte, atau rencanakan perjalanan. Data langsung dari sumber resmi.
                      </div>
                    </div>
                    <div className={styles.container33}>
                      <div className={styles.container34}>
                        <div className={styles.container35}>
                          <div className={styles.icon3} />
                        </div>
                        <div className={styles.text} />
                      </div>
                      <div className={styles.paragraph7}>
                        <b className={styles.next}>Next</b>
                      </div>
                    </div>
                  </section>
                  <section className={styles.container36}>
                    <div className={styles.container37}>
                      <div className={styles.image2} />
                      <div className={styles.mediaDisplay}>
                        <img className={styles.imageIcon10}
                          width={135}
                          height={106}
                          alt=""
                          src="/applyse/Image14@2x.png" />
                        <img className={styles.imageIcon11}
                          width={201}
                          height={86}
                          alt=""
                          src="/applyse/Image2@2x.png" />
                        <img className={styles.imageIcon12}
                          width={121}
                          height={101}
                          alt=""
                          src="/applyse/Image18@2x.png" />
                        <img className={styles.videoIcon}
                          width={289}
                          height={568}
                          alt=""
                          src="/applyse/Video@2x.png" />
                      </div>
                    </div>
                  </section>
                </div>
                <div className={styles.container38}>
                  <div className={styles.container39}>
                    <div className={styles.paragraph3}>
                      <b className={styles.seeNearbyTransit}>
                        See nearby transit
                      </b>
                    </div>
                  </div>
                  <div className={styles.container40}>
                    <div className={styles.paragraph3}>
                      <b className={styles.seeNearbyTransit}>Real-time data</b>
                    </div>
                  </div>
                  <div className={styles.container41}>
                    <div className={styles.paragraph3}>
                      <b className={styles.seeNearbyTransit}>Plan a trip</b>
                    </div>
                  </div>
                  <div className={styles.container42}>
                    <div className={styles.paragraph3}>
                      <b className={styles.seeNearbyTransit}>GO</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.container43}>
            <div className={styles.container44} />
            <div className={styles.container45}>
              <div className={styles.container46}>
                <img className={styles.imageIcon13}
                  width={500}
                  height={488.4}
                  alt=""
                  src="/applyse/Image@2x.png" />
              </div>
              <section className={styles.container47}>
                <div className={styles.container48}>
                  <div className={styles.heading23}>
                    <h1 className={styles.wePutThe}>
                      Bertanding bareng teman
                    </h1>
                  </div>
                  <div className={styles.doesYourCity}>
                    Ajak temanmu gabung room. Berebut siapa paling hafal jalur transportasi umum Jakarta.
                  </div>
                </div>
              </section>
            </div>
          </div>
          <div className={styles.container49}>
            <div className={styles.container50} />
            <div className={styles.container51}>
              <section className={styles.container52}>
                <div className={styles.container53}>
                  <div className={styles.heading24}>
                    <h1 className={styles.helpReshapeYour}>
                      Bantu kami lengkapi data
                    </h1>
                  </div>
                  <div className={styles.container54}>
                    <div className={styles.paragraph12}>
                      <div className={styles.isYourMetro}>
                        Lihat data yang kurang tepat? Laporkan aja.
                      </div>
                    </div>
                    <div className={styles.paragraphmargin}>
                      <div className={styles.isYourMetro}>
                        Bantu kami menyempurnakan data transportasi umum Jakarta.
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <div className={styles.container55}>
                <img className={styles.imageIcon14}
                  width={488.6}
                  height={453.5}
                  alt=""
                  src="/applyse/Image5@2x.png" />
              </div>
            </div>
          </div>
        </main>
        <section className={styles.container56}>
          <div className={styles.container57}>
            <div className={styles.container58}>
              <div className={styles.container59}>
                <div className={styles.heading25}>
                  <h1 className={styles.allTheBuses}>
                    Banyak rute.
                <br />
                Banyak halte.
                  </h1>
                </div>
                <div className={styles.container60}>
                  <div className={styles.paragraph3}>
                    <h2 className={styles.allTheBuses}>Like</h2>
                  </div>
                  <div className={styles.paragraph14}>
                    <div className={styles.mWrapper}>
                      <h1 className={styles.m}>M</h1>
                    </div>
                    <h2 className={styles.o}>o</h2>
                    <h2 className={styles.o}>n</h2>
                    <div className={styles.tWrapper}>
                      <h2 className={styles.t}>t</h2>
                    </div>
                    <h2 className={styles.r}>r</h2>
                    <div className={styles.mWrapper}>
                      <h2 className={styles.e}>e</h2>
                    </div>
                    <div className={styles.mWrapper}>
                      <h2 className={styles.a}>a</h2>
                    </div>
                    <div className={styles.lWrapper}>
                      <h2 className={styles.l}>l</h2>
                    </div>
                    <h2 className={styles.h2}>.</h2>
                  </div>
                </div>
              </div>
              <h3 className={styles.orChicagoLondon}>
                Dari BRT Transjakarta, KRL, MRT, sampai LRT…
              </h3>
            </div>
            <button className={styles.link6}>
              <div className={styles.paragraph5}>
                <b className={styles.downloadTransit}>See all 1000+ cities</b>
              </div>
              <div className={styles.container27} />
            </button>
          </div>
          <div className={styles.container62} />
        </section>
        <section className={styles.section2}>
          <div className={styles.container63}>
            <div className={styles.section3}>
              <div className={styles.listtransform}>
                <div className={styles.list}>
                  <section className={styles.listItem}>
                    <div className={styles.container64}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <div className={styles.paragraph16}>
                        <b className={styles.theBestTransportation}>
                          "The best transportation app l've ever used. I look
                          forward to using this easy to use app almost daily. It
                          is quick and efficient and simple. Thank you, Transit.
                          Well done."
                        </b>
                      </div>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container73}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.thisAppIs}>
                        "This app is essential when going around the city. It
                        clarifies all transit options.
                        <br />I use it a lot when out and about.
                        <br />
                        It will sense where you are and what buses/trains etc to
                        use. <br />
                        Highly recommended."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          Play Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container82}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "Transit is EXACTLY what I want from a public transit
                        navigation app. High quality, low monetization. No
                        complaints."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container91}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExtremely}>
                        "Transit is extremely user friendly and updates
                        constantly to ensure it's always functioning properly.
                        Whether you're just visiting or living here you need
                        this app to get around 💯."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container100}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "I love the Transit app. I use it daily since I take the
                        public transit everyday.
                        <br />
                        Really useful and helps a lot of commuters 👍😊."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container64}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.theBestTransportation2}>
                        "The best transportation app l've ever used. I look
                        forward to using this easy to use app almost daily. It
                        is quick and efficient and simple. Thank you, Transit.
                        Well done."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container73}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.thisAppIs}>
                        "This app is essential when going around the city. It
                        clarifies all transit options.
                        <br />I use it a lot when out and about.
                        <br />
                        It will sense where you are and what buses/trains etc to
                        use. <br />
                        Highly recommended."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          Play Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container82}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "Transit is EXACTLY what I want from a public transit
                        navigation app. High quality, low monetization. No
                        complaints."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container91}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExtremely}>
                        "Transit is extremely user friendly and updates
                        constantly to ensure it's always functioning properly.
                        Whether you're just visiting or living here you need
                        this app to get around 💯."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container100}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "I love the Transit app. I use it daily since I take the
                        public transit everyday.
                        <br />
                        Really useful and helps a lot of commuters 👍😊."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container64}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.theBestTransportation2}>
                        "The best transportation app l've ever used. I look
                        forward to using this easy to use app almost daily. It
                        is quick and efficient and simple. Thank you, Transit.
                        Well done."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container73}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <div className={styles.paragraph16}>
                        <b className={styles.thisAppIs3}>
                          "This app is essential when going around the city. It
                          clarifies all transit options.
                          <br />I use it a lot when out and about.
                          <br />
                          It will sense where you are and what buses/trains etc
                          to use. <br />
                          Highly recommended."
                        </b>
                      </div>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          Play Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container82}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "Transit is EXACTLY what I want from a public transit
                        navigation app. High quality, low monetization. No
                        complaints."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container91}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExtremely}>
                        "Transit is extremely user friendly and updates
                        constantly to ensure it's always functioning properly.
                        Whether you're just visiting or living here you need
                        this app to get around 💯."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container100}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "I love the Transit app. I use it daily since I take the
                        public transit everyday.
                        <br />
                        Really useful and helps a lot of commuters 👍😊."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container64}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.theBestTransportation2}>
                        "The best transportation app l've ever used. I look
                        forward to using this easy to use app almost daily. It
                        is quick and efficient and simple. Thank you, Transit.
                        Well done."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container73}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.thisAppIs}>
                        "This app is essential when going around the city. It
                        clarifies all transit options.
                        <br />I use it a lot when out and about.
                        <br />
                        It will sense where you are and what buses/trains etc to
                        use. <br />
                        Highly recommended."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          Play Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container82}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "Transit is EXACTLY what I want from a public transit
                        navigation app. High quality, low monetization. No
                        complaints."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container91}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExtremely}>
                        "Transit is extremely user friendly and updates
                        constantly to ensure it's always functioning properly.
                        Whether you're just visiting or living here you need
                        this app to get around 💯."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container100}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "I love the Transit app. I use it daily since I take the
                        public transit everyday.
                        <br />
                        Really useful and helps a lot of commuters 👍😊."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container64}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.theBestTransportation2}>
                        "The best transportation app l've ever used. I look
                        forward to using this easy to use app almost daily. It
                        is quick and efficient and simple. Thank you, Transit.
                        Well done."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container73}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.thisAppIs}>
                        "This app is essential when going around the city. It
                        clarifies all transit options.
                        <br />I use it a lot when out and about.
                        <br />
                        It will sense where you are and what buses/trains etc to
                        use. <br />
                        Highly recommended."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          Play Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container82}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "Transit is EXACTLY what I want from a public transit
                        navigation app. High quality, low monetization. No
                        complaints."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container91}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExtremely}>
                        "Transit is extremely user friendly and updates
                        constantly to ensure it's always functioning properly.
                        Whether you're just visiting or living here you need
                        this app to get around 💯."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className={styles.listItem}>
                    <div className={styles.container100}>
                      <div className={styles.container65}>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                        <div className={styles.container66}>
                          <div className={styles.icon4} />
                        </div>
                      </div>
                      <b className={styles.transitIsExactly}>
                        "I love the Transit app. I use it daily since I take the
                        public transit everyday.
                        <br />
                        Really useful and helps a lot of commuters 👍😊."
                      </b>
                    </div>
                    <div className={styles.container71}>
                      <div className={styles.container72}>
                        <div className={styles.icon9} />
                      </div>
                      <div className={styles.paragraph3}>
                        <div className={styles.appStoreReview}>
                          App Store review
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.section4}>
          <div className={styles.heading26}>
            <h1 className={styles.allTheBuses}>
              Dibuat untuk penumpang
              <br />
              dan penggiat transportasi umum
            </h1>
          </div>
          <div className={styles.container289}>
            <div className={styles.container290}>
              <img className={styles.containerIcon3}
                width={468}
                height={465}
                alt=""
                src="/applyse/Container6@2x.png" />
            </div>
            <section className={styles.container291}>
              <div className={styles.container292}>
                <div className={styles.container293}>
                  <div className={styles.container294}>
                    <div className={styles.container295}>
                      <div className={styles.icon154} />
                    </div>
                  </div>
                </div>
                <div className={styles.container296}>
                  <div className={styles.heading3}>
                    <h3 className={styles.busTrackingNot}>
                      Pantau bus, bukan pantau iklan
                    </h3>
                  </div>
                  <div className={styles.paragraph43}>
                    <div className={styles.noCreepyTargeting}>
                      Tidak ada pelacakan aneh. Tidak ada spam. Tidak ada pop-up yang mengganggu saat kamu kejar bus.
                    </div>
                  </div>
                </div>
              </div>
              <FeatureCard
                yourDataIsNotOurBusiness="Datamu bukan bisnis kami"
                weDontLinkYourLocationHistory="Kami tidak menyambungkan riwayat lokasimu dengan data pribadi. Kami juga tidak menjual data. Sesederhana itu."
                privacyAtTransit="Privasi di TransitGuessr"
              />
              <FeatureCard
                containerHeight="180.2px"
                containerBackground="radial-gradient(182.7% 121.8% at 50% 0%, #fccd36, #ffa900)"
                containerPadding="11px 6px 12px"
                containerHeight1="25px"
                iconHeight="25px"
                containerHeight2="180.2px"
                yourDataIsNotOurBusiness="Upgrade untuk lebih banyak"
                weDontLinkYourLocationHistory="TransitGuessr gratis dipakai, tapi nanti kami juga punya fitur berbayar lewat Royale. Berkat dukungan pengguna dan mitra agensi, kami bisa fokus ke fitur baru."
                linkWidth="151.6px"
                privacyAtTransit="Pelajari Royale"
              />
            </section>
          </div>
        </section>
        <section className={styles.section5} style={{ display: 'none' }}>
          <section className={styles.container297}>
            <div className={styles.heading27}>
              <h1 className={styles.allTheBuses}>
                <span
                  className={styles.proudToWorkIn}
                >{`Dibangun bareng<br/>dengan `}</span>
                <span className={styles.span}>
                  180+
                  <br />
                </span>
                <span className={styles.proudToWorkIn}>mitra agensi</span>
              </h1>
            </div>
            <div className={styles.fromTinyTowns}>
              Dari kota kecil sampai kota besar, TransitGuessr bantu penumpang
              jatuh cinta sama agensi transportasi mereka — lewat desain, data,
              dan fitur yang lebih baik.
            </div>
            <img className={styles.containerIcon4}
              width={146.7}
              height={125.5}
              alt=""
              src="/applyse/Container1@2x.png" />
          </section>
          <div className={styles.container298}>
            <section className={styles.container299}>
              <div className={styles.image3}>
                <img className={styles.groupIcon4}
                  width={196.8}
                  height={132.4}
                  alt=""
                  src="/applyse/Group3@2x.png" />
              </div>
              <div className={styles.container300}>
                <div className={styles.heading32}>
                  <h3 className={styles.busTrackingNot}>
                    Disesuaikan untuk kotamu
                  </h3>
                </div>
                <div className={styles.weTailorThe}>
                  Kami menyesuaikan aplikasi untuk kebutuhan penumpang di kotamu.
                  Perbaiki data lokal, tambah branding, jual tiket, dan dukung
                  sistem on-demand serta bike share.
                </div>
              </div>
            </section>
            <HighlightCard
              image="/Image24@2x.png"
              weBroadcastToMoreRiders="Sebar ke lebih banyak penumpang"
              thousandsOfRidersInYourCity="Ribuan penumpang di kotamu mengandalkan TransitGuessr untuk tahu detour, perubahan jaringan, dan gangguan layanan. Sampaikan pesan yang tepat ke orang yang tepat, tanpa ribet."
            />
            <HighlightCard
              containerAlignSelf="unset"
              containerHeight="480px"
              image="/Image8@2x.png"
              containerHeight1="285.6px"
              containerPadding="0px 0px 16px"
              weBroadcastToMoreRiders="Feedback lebih baik, layanan lebih baik"
              thousandsOfRidersInYourCity="Kami mengukur kepuasan di berbagai rute, halte, perjalanan, dan seluruh jaringan. Pakai alat feedback penumpang kami untuk selidiki kebersihan halte, keamanan, dan bus yang penuh."
            />
          </div>
          <div className={styles.container301}>
            <button className={styles.link7}>
              <div className={styles.paragraph5}>
                <b className={styles.downloadTransit}>Mari kerja sama</b>
              </div>
              <div className={styles.container27} />
            </button>
          </div>
          <section className={styles.container303}>
            <div className={styles.container304}>
              <CityGrid container="/Container2@2x.png" />
              <CityGrid container="/Container2@2x.png" />
            </div>
          </section>
        </section>
        <section className={styles.section6} style={{ display: 'none' }}>
          <div className={styles.heading28}>
            <h2 className={styles.allTheBuses}>Visi kami</h2>
          </div>
          <div className={styles.container305}>
            <section className={styles.containerWrapper}>
              <div className={styles.container306}>
                <div className={styles.container307}>
                  <div className={styles.paragraph12}>
                    <div className={styles.ourTeamBelieves}>
                      Tim kami percaya pada efek kota yang lebih baik dari
                      transportasi massal. Mengurangi macet. Mengurangi jejak
                      karbon. Membebaskan ruang kota untuk kehidupan di luar mobil.
                    </div>
                  </div>
                  <div className={styles.paragraphmargin}>
                    <div className={styles.byEmpoweringPeople}>
                      Dengan membantu orang meninggalkan mobil, kita bisa tukar
                      pom bensin jadi taman, parkir jadi tempat makan, dan jalan
                      macet jadi jalan penuh bus dan sepeda yang bantu kamu
                      melintas kota.
                    </div>
                  </div>
                </div>
                <button className={styles.link8}>
                  <div className={styles.paragraph5}>
                    <b className={styles.readOurManifesto}>
                      Baca manifesto kami
                    </b>
                  </div>
                  <div className={styles.text2} />
                </button>
              </div>
            </section>
            <img className={styles.containerIcon5}
              width={400}
              height={572}
              alt=""
              src="/applyse/Container5@2x.png" />
          </div>
        </section>
        <section className={styles.section7}>
          <div className={styles.ourPencilIsMightierThanThWrapper}>
            <h1 className={styles.ourPencilIs}>
              Tips & Fakta
            </h1>
          </div>
          <div className={styles.containerContainer}>
            <div className={styles.container308}>
              {linkItems.map((item, index) => (
                <ArticleCard
                  key={index}
                  image={item.image}
                  jun82026={item.jun82026}
                  tTCAndTransitAppAreTeaming={item.tTCAndTransitAppAreTeaming}
                  tTCAndTransitHeight={item.tTCAndTransitHeight}
                />
              ))}
              <section className={styles.link9}>
                <img className={styles.imageIcon15}
                  width={316}
                  height={180}
                  alt=""
                  src="/applyse/Image22@2x.png" />
                <div className={styles.paragraph47}>
                  <div className={styles.dec82025}>Dec 8, 2025</div>
                </div>
                <div className={styles.paragraph48}>
                  <h3 className={styles.ridersChoiceAwards}>
                    2025 Riders Choice Awards
                  </h3>
                </div>
              </section>
              {linkItems1.map((item, index) => (
                <ArticleCard
                  key={index}
                  image={item.image}
                  jun82026={item.jun82026}
                  tTCAndTransitAppAreTeaming={item.tTCAndTransitAppAreTeaming}
                  tTCAndTransitHeight={item.tTCAndTransitHeight}
                />
              ))}
            </div>
          </div>
          <div className={styles.linkWrapper}>
            <button className={styles.link10}>
              <div className={styles.paragraph5}>
                <b className={styles.readOurManifesto}>Lihat semua tips</b>
              </div>
              <div className={styles.text2} />
            </button>
          </div>
        </section>
        <section className={styles.section8}>
          <section className={styles.container309}>
            <div className={styles.container310}>
              <div className={styles.heading29}>
                <h1 className={styles.allTheBuses}>
                  <span className={styles.proudToWorkIn}>{`“The `}</span>
                  <span className={styles.bestApp}>best app</span>
                  <span className={styles.proudToWorkIn}>
                    {" "}
                    for
                    <br />
                    public transit”
                  </span>
                </h1>
              </div>
              <div className={styles.paragraph50}>
                <i className={styles.literallyAnyoneThat}>
                  — Literally anyone that uses it
                </i>
              </div>
            </div>
          </section>
          <div className={styles.container311}>
            <button className={styles.link11}>
              <div className={styles.container312}>
                <div className={styles.icon155} />
              </div>
            </button>
            <button className={styles.link11}>
              <div className={styles.container312}>
                <div className={styles.icon155} />
              </div>
            </button>
          </div>
        </section>
        <footer className={styles.footer} style={{ display: 'none' }}>
          <div className={styles.container314}>
            <div className={styles.text4}>
              <div className={styles.container315}>
                <div className={styles.container316}>
                  <div className={styles.container317}>
                    <div className={styles.heading33}>
                      <h1 className={styles.hungryForMoreContainer}>
                        <span
                          className={styles.hungryForMoreSign}
                        >{`Hungry for more?<br/>Sign up for our `}</span>
                        <span className={styles.newsletter}>newsletter!</span>
                      </h1>
                    </div>
                    <div className={styles.paragraph51}>
                      <h3 className={styles.secretFeaturesPartnerships}>
                        Secret features. Partnerships. Mobility trends.
                        <br />
                        All that, and more.
                      </h3>
                    </div>
                  </div>
                  <div className={styles.container318}>
                    <img className={styles.imageIcon16}
                      width={209}
                      height={258}
                      alt=""
                      src="/applyse/Image16@2x.png" />
                    <div className={styles.form}>
                      <input
                        className={styles.emailInput}
                        placeholder="Enter your email address"
                        type="text"
                      />
                      <div className={styles.placeholderForContainer2} />
                      <div className={styles.container319} />
                    </div>
                  </div>
                </div>
                <div className={styles.container320}>
                  <div className={styles.container321}>
                    <b className={styles.hello}>HELLO</b>
                    <div className={styles.container322}>
                      <div className={styles.press}>Regions</div>
                      <div className={styles.press}>Blog</div>
                      <div className={styles.press}>Press</div>
                      <div className={styles.press}>Help</div>
                    </div>
                  </div>
                  <div className={styles.container323}>
                    <b className={styles.hello}>ABOUT</b>
                    <div className={styles.container324}>
                      <div className={styles.container325}>
                        <div className={styles.paragraph52}>
                          <div className={styles.team}>Our vision</div>
                        </div>
                      </div>
                      <div className={styles.container326}>
                        <div className={styles.paragraph52}>
                          <div className={styles.team}>Team</div>
                        </div>
                      </div>
                      <div className={styles.container327}>
                        <div className={styles.paragraph52}>
                          <div className={styles.team}>Jobs</div>
                        </div>
                      </div>
                      <div className={styles.press}>Privacy</div>
                      <div className={styles.termsOfUse}>Terms of use</div>
                    </div>
                  </div>
                  <div className={styles.container328}>
                    <b className={styles.hello}>PARTNERS</b>
                    <div className={styles.container329}>
                      <div
                        className={styles.termsOfUse}
                      >{`Agencies & operators`}</div>
                      <div className={styles.press}>Royale</div>
                      <div className={styles.press}>APIs</div>
                      <div className={styles.press}>Beyond the app</div>
                      <div className={styles.press}>Get in touch</div>
                    </div>
                  </div>
                  <div className={styles.container330}>
                    <b className={styles.hello}>CONTACT</b>
                    <div className={styles.team}>info@transit.app</div>
                    <div className={styles.container331}>
                      <div className={styles.link13}>
                        <div className={styles.container332}>
                          <div className={styles.icon9} />
                        </div>
                      </div>
                      <div className={styles.link14}>
                        <div className={styles.container333}>
                          <div className={styles.icon158} />
                        </div>
                      </div>
                      <div className={styles.link13}>
                        <div className={styles.container332}>
                          <div className={styles.icon9} />
                        </div>
                      </div>
                      <div className={styles.link13}>
                        <div className={styles.container332}>
                          <div className={styles.icon9} />
                        </div>
                      </div>
                    </div>
                    <div className={styles.container336} />
                    <button className={styles.link17}>
                      <div className={styles.paragraph5}>
                        <b className={styles.getTheApp}>Get the app</b>
                      </div>
                      <img className={styles.containerIcon6}
                        width={24}
                        height={24}
                        alt=""
                        src="/applyse/Container4.svg" />
                      <div className={styles.container337} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
        <footer className={styles.footer}>
          <div className="mx-auto w-full max-w-6xl px-4 py-10 text-muted-foreground">
            <div className="font-display text-sm font-bold text-[#12452b]">TransitGuessr</div>
            <div className="mt-2 text-xs">
              Data GTFS Transjakarta, KRL, MRT, dan LRT Jabodebek / Jabodetabek. Warna jalur sesuai aslinya.
            </div>
            <div className="mt-1 text-xs">
              Dibuat untuk hiburan: Tebak rute, Tebak halte, dan rencanakan perjalanan.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default TransitGuessrHero;
