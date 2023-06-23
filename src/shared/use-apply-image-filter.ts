import { useEffect, useRef, useState } from "react";

// filter to grayscale and blur
const applyFilter = (
  images: HTMLCollectionOf<HTMLImageElement> | HTMLImageElement[],
  grayscale = true,
) => {
  for (var i = 0; i < images.length; i++) {
    if (images[i] instanceof HTMLImageElement) {
      images[i].style.filter = grayscale ? "grayscale(100%) blur(3px)" : "none";
    }
  }
};

export const useApplyImageFilter = (initialValue = true) => {
  const [shouldApplyFilter, setShouldGrayscale] = useState(initialValue);
  const hasRun = useRef(false);

  useEffect(() => {
    console.log("Applying filter", shouldApplyFilter);

    applyFilter(document.getElementsByTagName("img"), shouldApplyFilter);

    // Mutation observer to detect changes in the DOM and set new images to grayscale and blur
    const observer = new MutationObserver((mutations) => {
      if (!shouldApplyFilter) {
        return;
      }

      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (nodeIsImageElement(node)) {
              // If new img element is added, set it to grayscale
              applyFilter([node], shouldApplyFilter);
            } else if (
              nodeIsDOMElement(node) &&
              node.getElementsByTagName !== undefined
            ) {
              // If a new node is added that contains img elements, set them to grayscale
              applyFilter(node.getElementsByTagName("img"), shouldApplyFilter);
            }
          }
        }
      });
    });

    if (shouldApplyFilter && !hasRun.current) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      hasRun.current = true;
    } else {
      observer.disconnect();
      hasRun.current = false;
    }

    return () => observer.disconnect();
  }, [shouldApplyFilter]);

  return setShouldGrayscale;
};

const nodeIsImageElement = (node: Node): node is HTMLImageElement => {
  return node.nodeName === "IMG";
};

const nodeIsDOMElement = (node: Node): node is HTMLElement => {
  return node instanceof HTMLElement;
};
