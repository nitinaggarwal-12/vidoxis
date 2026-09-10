import { Page, ElementHandle } from "puppeteer";
import { TriadSelector } from "../types/trace.js";

export interface ResolvedElementTarget {
  handle: ElementHandle<any> | null;
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

    // Tier 1: Primary — Accessible Name & ARIA Role (with Deep Shadow DOM Traversal)
    try {
      const { role, name, exact } = selector.primary;
      const ariaHandle = await page.evaluateHandle((roleArg, nameArg, exactArg) => {
        // Recursive tree walker piercing all open shadowRoot boundaries
        const stack: Node[] = [document];
        while (stack.length > 0) {
          const current = stack.pop()!;
          if (current instanceof Element) {
            const elRole = current.getAttribute("role") || (current.tagName ? current.tagName.toLowerCase() : "");
            const elName = current.getAttribute("aria-label") || current.getAttribute("name") || (current as HTMLElement).innerText || "";

            const roleMatches = (roleArg === "button" && current.tagName === "BUTTON") ||
                                (roleArg === "textbox" && (current.tagName === "INPUT" || current.getAttribute("role") === "textbox")) ||
                                (roleArg === "combobox" && (current.tagName === "SELECT" || current.getAttribute("role") === "combobox")) ||
                                (roleArg === "spinbutton" && current.getAttribute("role") === "spinbutton") ||
                                elRole === roleArg;

            if (roleMatches) {
              const trimmedName = elName.trim();
              const matches = exactArg ? (trimmedName === nameArg) : trimmedName.toLowerCase().includes(nameArg.toLowerCase());
              if (matches) {
                const rect = current.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) return current;
              }
            }

            if (current.shadowRoot) {
              for (let i = current.shadowRoot.children.length - 1; i >= 0; i--) {
                stack.push(current.shadowRoot.children[i]);
              }
            }
          }
          for (let i = current.childNodes.length - 1; i >= 0; i--) {
            stack.push(current.childNodes[i]);
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

    // Tier 2: Secondary — Stable testId / data-test-id (with Deep Shadow DOM Traversal)
    if (selector.secondary && selector.secondary.testId) {
      try {
        const testId = selector.secondary.testId;
        this.assertSafeSelector(`[data-test-id="${testId}"]`);

        const testIdHandle = await page.evaluateHandle((targetId) => {
          const stack: Node[] = [document];
          while (stack.length > 0) {
            const current = stack.pop()!;
            if (current instanceof Element) {
              if (current.getAttribute("data-test-id") === targetId) {
                const rect = current.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) return current;
              }
              if (current.shadowRoot) {
                for (let i = current.shadowRoot.children.length - 1; i >= 0; i--) {
                  stack.push(current.shadowRoot.children[i]);
                }
              }
            }
            for (let i = current.childNodes.length - 1; i >= 0; i--) {
              stack.push(current.childNodes[i]);
            }
          }
          return null;
        }, testId);

        const asElement = testIdHandle.asElement();
        if (asElement) {
          const bbox = await asElement.boundingBox();
          if (bbox) {
            return {
              handle: asElement,
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
