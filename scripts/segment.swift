// Person matte for a video using Apple Vision. Writes raw 8-bit gray frames
// (video-sized) to stdout; pipe into ffmpeg.
// usage: swift scripts/segment.swift in.mp4 | ffmpeg -f rawvideo -pix_fmt gray -s WxH -r 25 -i - ...
import AVFoundation
import CoreImage
import Vision

let path = CommandLine.arguments[1]
let asset = AVURLAsset(url: URL(fileURLWithPath: path))
let track = asset.tracks(withMediaType: .video)[0]
let size = track.naturalSize
let W = Int(size.width), H = Int(size.height)

let reader = try! AVAssetReader(asset: asset)
let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
])
reader.add(output)
reader.startReading()

let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8
let handler = VNSequenceRequestHandler()
let ctx = CIContext(options: [.workingColorSpace: NSNull()])
var bytes = [UInt8](repeating: 0, count: W * H)
var n = 0
let out = FileHandle.standardOutput

while let sample = output.copyNextSampleBuffer() {
    guard let pb = CMSampleBufferGetImageBuffer(sample) else { continue }
    try! handler.perform([request], on: pb)
    let mask = request.results!.first!.pixelBuffer
    let mw = CGFloat(CVPixelBufferGetWidth(mask)), mh = CGFloat(CVPixelBufferGetHeight(mask))
    let img = CIImage(cvPixelBuffer: mask)
        .transformed(by: CGAffineTransform(scaleX: CGFloat(W) / mw, y: CGFloat(H) / mh))
    bytes.withUnsafeMutableBytes { buf in
        ctx.render(img, toBitmap: buf.baseAddress!, rowBytes: W, bounds: CGRect(x: 0, y: 0, width: W, height: H),
                   format: .L8, colorSpace: nil)
    }
    out.write(Data(bytes))
    n += 1
    if n % 100 == 0 { FileHandle.standardError.write("\(n) frames\n".data(using: .utf8)!) }
}
FileHandle.standardError.write("done \(n) frames, mask from \(W)x\(H)\n".data(using: .utf8)!)
