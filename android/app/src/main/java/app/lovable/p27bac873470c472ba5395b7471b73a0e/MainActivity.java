package app.lovable.p27bac873470c472ba5395b7471b73a0e;

import android.os.Bundle;
import android.content.Intent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(QahwaNativePlugin.class);
        super.onCreate(savedInstanceState);
        LocalPdfStore.acceptIntent(this, getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        LocalPdfStore.acceptIntent(this, intent);
    }
}
