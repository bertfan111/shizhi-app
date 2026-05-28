/**
 * 导航工具函数。
 *
 * Web 端的「返回」陷阱：
 *   - 用户直接通过 URL 打开 /learn、/story/X、/map 这类页面（或刷新页面）时，
 *     浏览器历史栈中只有当前一项，router.back() 会无效。
 *   - 修复方式：先用 router.canGoBack() 判断；不能 back 时跳回 Tab 首页（大本营）。
 *
 * 用法：
 *   const router = useRouter();
 *   <Button onPress={() => safeBack(router)} />
 */
import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

export function safeBack(router: Router): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}
