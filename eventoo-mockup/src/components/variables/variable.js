import logo from "../../assets/images/logo.svg";
import Background from "../../assets/images/dance/hero.jpg";

const navitem = [
  { id: 1, name: "Home", link: "#home" },
  { id: 2, name: "Today", link: "#today" },
  { id: 3, name: "Calendar", link: "#week" },
  { id: 4, name: "Highlights", link: "#highlights" },
  { id: 5, name: "Contact", link: "#contact" },
];

const image = logo;

const bgimg = {
  backgroundImage: `url(${Background})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const bannerText = {
  subHeading: "This week's floor",
  heading: "Stockholm Bachata & Salsa",
  details:
    "Drop-in classes. Packed socials. Parties people stay for. Bachata, salsa, and kizomba — one public calendar.",
};

const footerbg = {
  background: "#0f2f44",
};

export { navitem, image, bgimg, bannerText, footerbg };
