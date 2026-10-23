import SwiftRs
import Tauri
import UIKit
import WebKit

struct ShareArgs: Decodable { let path: String; let id: String; let name: String; let mime: String }
class BazCutSharePlugin: Plugin {
  @objc public func share(_ invoke: Invoke) throws {
    let args=try invoke.parseArgs(ShareArgs.self)
    guard args.id.range(of:"^export-[A-Za-z0-9-]{1,72}$",options:.regularExpression) != nil, !args.name.contains("/"), !args.name.contains("\\"), !args.name.isEmpty else { invoke.reject("Invalid export identity");return }
    let manager=FileManager.default
    let source=URL(fileURLWithPath:args.path)
    guard manager.fileExists(atPath:source.path) else {invoke.reject("Export file is missing");return}
    let directory=manager.temporaryDirectory.appendingPathComponent("bazcut-exports").appendingPathComponent(args.id)
    try manager.createDirectory(at:directory,withIntermediateDirectories:true)
    let destination=directory.appendingPathComponent(args.name)
    if manager.fileExists(atPath:destination.path){try manager.removeItem(at:destination)}
    try manager.copyItem(at:source,to:destination)
    DispatchQueue.main.async {
      guard let scene=UIApplication.shared.connectedScenes.compactMap({$0 as? UIWindowScene}).first(where:{$0.activationState == .foregroundActive}), let root=scene.windows.first(where:{$0.isKeyWindow})?.rootViewController else {invoke.reject("No active window");return}
      var presenter=root
      while let presented=presenter.presentedViewController {presenter=presented}
      let share=UIActivityViewController(activityItems:[destination],applicationActivities:nil)
      if let popover=share.popoverPresentationController {popover.sourceView=presenter.view;popover.sourceRect=CGRect(x:presenter.view.bounds.midX,y:presenter.view.bounds.midY,width:1,height:1)}
      share.completionWithItemsHandler={_,completed,_,error in if let error=error {invoke.reject(error.localizedDescription)}else{invoke.resolve(["saved":completed])}}
      presenter.present(share,animated:true)
    }
  }
}
@_cdecl("init_plugin_bazcut_share")
public func initPlugin() -> Plugin { BazCutSharePlugin() }
