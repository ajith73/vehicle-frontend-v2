import ReactGA from "react-ga4";

export const initGA = () => {
  ReactGA.initialize("G-WTJGSXDEHG");
};

export const trackPage = () => {
  ReactGA.send({
    hitType: "pageview",
    page: window.location.pathname + window.location.search,
  });
};

export const trackEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({
    category,
    action,
    label,
  });
};
