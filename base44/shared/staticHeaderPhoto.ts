export function isStaticHeaderPhotoUrl(url) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return false;
  const animated = /\.(?:gif|apng|mp4|webm|mov|m4v|avi|mkv|ogv)(?:$|[?#])/i;
  const format = /[?&](?:format|fm|f)=(?:gif|apng|mp4|webm)(?:&|$)/i;
  return !animated.test(url) && !format.test(url);
}