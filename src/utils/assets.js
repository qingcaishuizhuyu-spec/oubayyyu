/**
 * 集中生成 public 素材的 URL。
 * 后续可在本文件增加具名映射，避免路径字符串散落在组件中。
 */
export function publicAsset(folder, fileName) {
  const safeFolder = String(folder).replace(/^\/+|\/+$/g, '')
  const safeFileName = String(fileName).replace(/^\/+/g, '')
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${baseUrl}/${safeFolder}/${safeFileName}`
}

export const imagePath = (fileName) => publicAsset('images', fileName)
export const audioPath = (fileName) => publicAsset('audio', fileName)
export const fontPath = (fileName) => publicAsset('fonts', fileName)
export const videoPath = (fileName) => publicAsset('videos', fileName)

// 统一维护站点用到的公开素材，后续替换文件时只需修改这里。
export const assets = Object.freeze({
  cake: imagePath('cake-19.png'),
  cakeChoices: [
    {
      src: imagePath('cake-choice-0.png'),
      width: 609,
      height: 802,
    },
    {
      src: imagePath('cake-choice-1.png'),
      width: 810,
      height: 871,
    },
    {
      src: imagePath('cake-choice-2.png'),
      width: 555,
      height: 856,
    },
    {
      src: imagePath('cake-choice-3.png'),
      width: 543,
      height: 835,
    },
    {
      src: imagePath('cake-choice-4.png'),
      width: 625,
      height: 853,
    },
    {
      src: imagePath('cake-choice-5.png'),
      width: 541,
      height: 849,
    },
    {
      src: imagePath('cake-choice-6.png'),
      width: 622,
      height: 532,
    },
  ],
  envelope: imagePath('envelope.png'),
  luckyMagic: imagePath('lucky-magic.jpg'),
  paper: imagePath('paper.png'),
  helloEarth: imagePath('hello-earth.jpg'),
  portraits: [
    imagePath('portrait-1.jpg'),
    imagePath('portrait-2.jpg'),
    imagePath('portrait-3.jpg'),
  ],
  videos: [
    videoPath('video-1.mp4'),
    videoPath('video-2.mp4'),
    videoPath('video-3.mp4'),
  ],
})
