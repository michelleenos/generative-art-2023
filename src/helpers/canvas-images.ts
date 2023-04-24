import JSZip from 'jszip'

// ffmpeg command image to video
// ffmpeg -r 30 -f image2 -i image-%d.png -crf 20 -pix_fmt yuv420p video.mp4

// to use every other image:
// ffmpeg -r FRAMERATE -i image-%d.png -vf "'select=not(mod,2)',setpts=N/FRAME_RATE/TB" -crf 20 -pix_fmt yuv420p video.mp4
// the setpts part is to adjust the output frame rate bc timestamps of every other image will be incorrect
// https://superuser.com/questions/1156837/using-every-nth-image-in-sequence-to-create-video-using-ffmpeg

// -r or -framerate --> frame rate
// -f --> format (seems optional)
// -i --> input
// -vcodec libx264 --> video codec (prob optional too)
// -crf --> quality (0-51) 0 is lossless, 51 is worst
// -pix_fmt --> pixel format (needed for quicktime etc to work)
// -vf or -filter:v --> video filter (optional)

function makeImages(canvas) {
    let zip = new JSZip()
    let count = 0

    const getImage = () => {
        count++
        return new Promise((resolve, _reject) => {
            canvas.toBlob((blob) => {
                zip.file(`image-${count}.png`, blob)
                resolve(blob)
            })
        })
    }

    function downloadZip() {
        zip.generateAsync({ type: 'blob' }).then(function (content) {
            let url = URL.createObjectURL(content)
            let name = 'images.zip'
            download(url, name)
        })
    }

    return { getImage, downloadZip }
}

function download(href: string, name: string) {
    let link = document.createElement('a')
    link.download = name
    link.style.opacity = '0'
    document.body.append(link)
    link.href = href
    link.click()
    link.remove()
}

export default makeImages
