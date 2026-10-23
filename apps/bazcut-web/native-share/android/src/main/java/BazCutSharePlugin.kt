package app.bazaara.bazcut.share

import android.app.Activity
import android.content.Intent
import androidx.core.content.FileProvider
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import java.io.File

@InvokeArg
class ShareArgs { var path: String = ""; var id: String = ""; var name: String = ""; var mime: String = "application/octet-stream" }
@TauriPlugin
class BazCutSharePlugin(private val activity: Activity): Plugin(activity) {
  @Command
  fun share(invoke: Invoke) {
    val args=invoke.parseArgs(ShareArgs::class.java)
    if(!Regex("export-[A-Za-z0-9-]{1,72}").matches(args.id)||args.name.isBlank()||args.name.contains('/')||args.name.contains('\\')){invoke.reject("Invalid export identity");return}
    try {
      // Rust resolves the sandbox path and restricts the ID to generated exports.
      val source=File(args.path)
      if(!source.isFile){invoke.reject("Export file is missing");return}
      val folder=File(activity.cacheDir,"bazcut-exports/${args.id}");folder.mkdirs()
      val output=File(folder,args.name);source.copyTo(output,overwrite=true)
      val uri=FileProvider.getUriForFile(activity,"${activity.packageName}.bazcut.exports",output)
      activity.runOnUiThread {
        try { val intent=Intent(Intent.ACTION_SEND).apply { type=args.mime;putExtra(Intent.EXTRA_STREAM,uri);addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION) }
          activity.startActivity(Intent.createChooser(intent,"Save or share ${args.name}"))
          val result=JSObject();result.put("saved",true);invoke.resolve(result)
        } catch(e:Exception){invoke.reject(e.message?:"Could not open share dialog")}
      }
    }catch(e:Exception){invoke.reject(e.message?:"Could not prepare export")}
  }
}
