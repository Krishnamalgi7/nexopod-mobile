
import { useEffect, useState } from "react";
import {
  Image,
  type ImageProps,
  type ImageSourcePropType,
} from "react-native";

interface RemoteImageProps extends Omit<ImageProps, "source"> {
  uri?: string | null;
}

const FALLBACK_IMAGE =
  require("../../../assets/images/user_page/fallback.png");

export default function RemoteImage({
  uri,
  onError,
  ...props
}: RemoteImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const source: ImageSourcePropType =
    !uri || hasError ? FALLBACK_IMAGE : { uri };

  return (
    <Image
      {...props}
      source={source}
      onError={(event) => {
        setHasError(true);
        onError?.(event);
      }}
    />
  );
}
