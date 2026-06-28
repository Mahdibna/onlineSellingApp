import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const TabCircle = (props) => (
  <Svg
    width={96}
    height={40}
    viewBox="0 0 96 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14 14L14 0H0C7.73199 0 14 6.26801 14 14Z"
      fill="black"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M96 9.15527e-05V7.62939e-06L82 7.62939e-06V14.0001C82 6.26809 88.268 9.15527e-05 96 9.15527e-05Z"
      fill="black"
    />
    <Path d="M13 0H83V5C83 24.33 67.33 40 48 40V40C28.67 40 13 24.33 13 5V0Z" fill="black" />
  </Svg>
);
export default TabCircle;
