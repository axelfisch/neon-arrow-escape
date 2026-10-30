import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
// Rasterize the existing favicon geometry; no AppKit/window server required.
let size=1024, scale: CGFloat=32
let context=CGContext(data:nil,width:size,height:size,bitsPerComponent:8,bytesPerRow:size*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.noneSkipLast.rawValue)!
context.setFillColor(CGColor(red:7/255,green:11/255,blue:22/255,alpha:1));context.fill(CGRect(x:0,y:0,width:size,height:size))
let cyan=CGColor(red:0,green:212/255,blue:1,alpha:1)
context.setStrokeColor(cyan);context.setLineWidth(2.4*scale);context.setLineCap(.round)
context.move(to:CGPoint(x:7*scale,y:16*scale));context.addLine(to:CGPoint(x:19*scale,y:16*scale));context.strokePath()
context.setFillColor(cyan);context.move(to:CGPoint(x:17.2*scale,y:10.8*scale));context.addLine(to:CGPoint(x:24.4*scale,y:16*scale));context.addLine(to:CGPoint(x:17.2*scale,y:21.2*scale));context.closePath();context.fillPath()
let output=URL(fileURLWithPath:"ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")
let destination=CGImageDestinationCreateWithURL(output as CFURL,UTType.png.identifier as CFString,1,nil)!
CGImageDestinationAddImage(destination,context.makeImage()!,nil)
guard CGImageDestinationFinalize(destination) else { fatalError("Cannot write icon") }
print("Neon Arrow icon generated from existing favicon geometry")
