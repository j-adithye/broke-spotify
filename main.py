import threading
import time
import os
import sys

# ── ensure app directory is in path ──
APP_DIR = os.path.dirname(os.path.abspath(__file__))
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

from kivy.app import App
from kivy.uix.anchorlayout import AnchorLayout
from kivy.uix.label import Label
from kivy.lang import Builder
from kivy.clock import Clock

# Android WebView via pyjnius
try:
    from android.runnable import run_on_ui_thread
    from jnius import autoclass

    WebView          = autoclass('android.webkit.WebView')
    WebViewClient    = autoclass('android.webkit.WebViewClient')
    WebSettings      = autoclass('android.webkit.WebSettings')
    PythonActivity   = autoclass('org.kivy.android.PythonActivity')
    ANDROID          = True
except Exception:
    ANDROID = False

KV = '''
AnchorLayout:
    anchor_x: 'center'
    anchor_y: 'center'

    Label:
        id: status_label
        text: "Starting Swave..."
        font_size: '18sp'
        color: 0.36, 0.48, 0.93, 1
'''

flask_ready = threading.Event()

def start_flask():
    try:
        from app import app
        # Signal ready just before serving
        threading.Timer(1.5, flask_ready.set).start()
        app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
    except Exception as e:
        print(f"[Flask] Error: {e}")
        flask_ready.set()   # unblock UI even on error


if ANDROID:
    @run_on_ui_thread
    def load_webview(_dt):
        activity = PythonActivity.mActivity
        webview  = WebView(activity)

        settings = webview.getSettings()
        settings.setJavaScriptEnabled(True)
        settings.setDomStorageEnabled(True)
        settings.setMediaPlaybackRequiresUserGesture(False)
        settings.setCacheMode(WebSettings.LOAD_DEFAULT)

        webview.setWebViewClient(WebViewClient())
        webview.loadUrl('http://127.0.0.1:5000')

        activity.setContentView(webview)


class SwaveApp(App):
    def build(self):
        self.root = Builder.load_string(KV)
        return self.root

    def on_start(self):
        # Start Flask in background thread
        t = threading.Thread(target=start_flask, daemon=True)
        t.start()

        # Poll until Flask is ready then switch to WebView
        Clock.schedule_interval(self._check_flask, 0.5)

    def _check_flask(self, dt):
        label = self.root.ids.status_label
        dots  = getattr(self, '_dots', 0)
        self._dots = (dots + 1) % 4
        label.text = "Starting Swave" + "." * (self._dots + 1)

        if flask_ready.is_set():
            label.text = "Loading..."
            if ANDROID:
                Clock.schedule_once(load_webview, 0.2)
            return False   # stop polling


if __name__ == '__main__':
    SwaveApp().run()
