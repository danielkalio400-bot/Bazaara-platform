"use client";

import {
  useState
} from "react";

import styles from "../app/shopping/products/[slug]/product-detail.module.css";


type MediaItem = {
  url: string;
  alt: string;
};


export function ProductGallery({
  media,
  title
}: {
  media: MediaItem[];
  title: string;
}) {

  const [
    selectedIndex,
    setSelectedIndex
  ] =
    useState(0);


  const selected =
    media[selectedIndex] ??
    media[0];


  if (!selected) {

    return (
      <div
        className={
          styles.galleryEmpty
        }
      >
        No image available
      </div>
    );
  }


  return (
    <div
      className={
        styles.galleryColumn
      }
    >
      <div
        className={
          styles.mainImage
        }
      >
        <img
          src={
            selected.url
          }
          alt={
            selected.alt ||
            title
          }
          decoding="async"
          fetchPriority="high"
        />
      </div>


      {media.length > 1 ? (
        <div
          className={
            styles.thumbnails
          }
          aria-label="Product images"
        >
          {media
            .slice(
              0,
              6
            )
            .map(
              (
                item,
                index
              ) => (
                <button
                  key={
                    `${item.url}-${index}`
                  }
                  type="button"
                  className={
                    index ===
                    selectedIndex
                      ? `${styles.thumbnail} ${styles.thumbnailActive}`
                      : styles.thumbnail
                  }
                  onClick={
                    () =>
                      setSelectedIndex(
                        index
                      )
                  }
                  aria-label={
                    `View image ${index + 1} of ${title}`
                  }
                >
                  <img
                    src={
                      item.url
                    }
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              )
            )}
        </div>
      ) : null}
    </div>
  );
}
