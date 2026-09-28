/** Gỡ splash dựng sẵn trong index.html: mờ dần rồi xoá khỏi DOM. Gọi nhiều lần vẫn an toàn. */
export function hideSplash(): void {
  const splash = document.getElementById('splash')
  if (!splash || splash.classList.contains('splash-hide')) return
  splash.classList.add('splash-hide')
  const remove = () => splash.remove()
  splash.addEventListener('transitionend', remove, { once: true })
  // Không có transition (reduced motion, tab ẩn) thì vẫn gỡ.
  setTimeout(remove, 400)
}
