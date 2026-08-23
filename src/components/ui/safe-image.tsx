"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { getMediaUrl } from "@/lib/media/media-url";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src?: string | null;
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = "/placeholder-garment.webp";

/**
 * SafeImage Component
 * Wraps next/image with canonical URL normalization and single-shot error fallback.
 * Prevents broken image icons and infinite error loops.
 */
export function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  onError,
  ...rest
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  const initialUrl = getMediaUrl(src);
  const currentSrc = hasError ? fallbackSrc : initialUrl;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      if (onError) {
        onError(e);
      }
    }
  };

  return (
    <Image
      src={currentSrc}
      alt={alt || "Rust & Revive garment"}
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}
