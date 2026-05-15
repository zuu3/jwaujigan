import emotionStyled from "@emotion/styled";
import type { CreateStyled } from "@emotion/styled";

const noTransient = (prop: string) => !prop.startsWith("$");

const styled = new Proxy(emotionStyled, {
  apply(target, _thisArg, [tag, options]) {
    return (target as Function)(tag, {
      shouldForwardProp: noTransient,
      ...options,
    });
  },
  get(target, prop: string) {
    if (prop in target) {
      const val = (target as any)[prop];
      if (typeof val === "function") {
        return (target as Function)(prop, { shouldForwardProp: noTransient });
      }
      return val;
    }
    return (target as Function)(prop, { shouldForwardProp: noTransient });
  },
}) as CreateStyled;

export default styled;
