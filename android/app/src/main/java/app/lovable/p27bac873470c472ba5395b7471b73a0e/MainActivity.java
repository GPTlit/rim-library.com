package app.lovable.p27bac873470c472ba5395b7471b73a0e;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(QahwaNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
