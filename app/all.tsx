/**
 * 老路由 /all 的兼容：重定向到字库 Tab。
 */
import { Redirect } from 'expo-router';

export default function AllRedirect() {
  return <Redirect href="/library" />;
}
