import { Page, ElementHandle } from "puppeteer";
import { TriadSelector } from "../types/trace.js";

export interface ResolvedElementTarget {
  handle: ElementHandle<Element> | null;
  methodUsed: "primary_aria" | "secondary_testid" | "fallback_bbox" | "failed";
  bbox: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number };
}

export class TriadSelectorResolver {
  /**
   * Enforces the Angular Class Name Firewall.
   * Throws error if any selector attempts to rely on fragile Angular CSS hashes.
   */
  public static assertSafeSelector(selectorString: string): void {
    const angularRegex = /\.mat-[a-z0-9_-]+|\.cdk-[a-z0-9_-]+|\.ng-[a-z0-9_-]+/i;
    if (angularRegex.test(selectorString)) {
      throw new Error(
        `[TriadSelector Security Violation] Angular-generated CSS class names are strictly forbidden: "${selectorString}". ` +
        `Use ARIA Accessible Name/Role or stable [data-test-id] instead.`
      );
    }
  }

  /**
   * Resolves an element via the 3-tier Triad Hierarchy.
   */
  public static async resolve(page: Page, selector: TriadSelector): Promise<ResolvedElementTarget> {
    const viewport = page.viewport() || { width: 1920, height: 1080 };

    // Tier 1: Primary — Accessible Name & ARIA Role
    try {
      const { role, name, exact } = selector.primary;
      const ariaHandle = await page.evaluateHandle((roleArg, nameArg, exactArg) => {
        // Find all matching ARIA role elements or native equivalents
        const elements = Array.from(document.querySelectorAll(`[role="${roleArg}"], button, input, select, a`));
        for (const el of elements) {
          const elRole = el.getAttribute("role") || (el.tagName ? el.tagName.toLowerCase() : "");
          const elName = el.getAttribute("aria-label") || el.getAttribute("name") || (el as HTMLElement).innerText || "";
          
          const roleMatches = (roleArg === "button" && el.tagName === "BUTTON") ||
                              (roleArg === "textbox" && (el.tagName === "INPUT" || el.getAttribute("role") === "textbox")) ||
                              (roleArg === "combobox" && (el.tagName === "SELECT" || el.getAttribute("role") === "combobox")) ||
                              (roleArg === "spinbutton" && el.getAttribute("role") === "spinbutton") ||
                              elRole === roleArg;

          if (roleMatches) {
            const trimmedName = elName.trim();
            const matches = exactArg ? (trimmedName === nameArg) : trimmedName.toLowerCase().includes(nameArg.toLowerCase());
            if (matches) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) return el;
            }
          }
        }
        return null;
      }, role, name, exact);

      const asElement = ariaHandle.asElement();
      if (asElement) {
        const bbox = await asElement.boundingBox();
        if (bbox) {
          return {
            handle: asElement,
            methodUsed: "primary_aria",
            bbox,
            center: { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }
          };
        }
      }
    } catch (err) {
      // Fall through to secondary
    }

    // Tier 2: Secondary — Stable testId / data-test-id
    if (selector.secondary && selector.secondary.testId) {
      try {
        const testIdSelector = `[data-test-id="${selector.secondary.testId}"]`;
        this.assertSafeSelector(testIdSelector);
        
        const elHandle = await page.$(testIdSelector);
        if (elHandle) {
          const bbox = await elHandle.boundingBox();
          if (bbox) {
            return {
              handle: elHandle,
              methodUsed: "secondary_testid",
              bbox,
              center: { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }
            };
          }
        }
      } catch (err) {
        // Fall through to fallback
      }
    }

    // Tier 3: Fallback — Normalized Spatial Bounding-Box [ymin, xmin, ymax, xmax] (0..1000)
    if (selector.fallback && selector.fallback.bbox) {
      const [ymin, xmin, ymax, xmax] = selector.fallback.bbox;
      const x = (xmin / 1000) * viewport.width;
      const y = (ymin / 1000) * viewport.height;
      const width = ((xmax - xmin) / 1000) * viewport.width;
      const height = ((ymax - ymin) / 1000) * viewport.height;

      return {
        handle: null,
        methodUsed: "fallback_bbox",
        bbox: { x, y, width, height },
        center: { x: x + width / 2, y: y + height / 2 }
      };
    }

    return {
      handle: null,
      methodUsed: "failed",
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      center: { x: 0, y: 0 }
    };
  }
}
