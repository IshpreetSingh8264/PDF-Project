import { useEffect } from 'react';
import useDrivePicker from 'react-google-drive-picker'


function App() {
    const [openPicker, authResponse] = useDrivePicker();
    // const customViewsArray = [new google.picker.DocsView()]; // custom view
    const handleOpenPicker = () => {
        openPicker({
            clientId: '826586389397-ohce3239dgjllc242h119bj3ecjn77mp.apps.googleusercontent.com',
            developerKey: 'AIzaSyANQx_ZaksvT_v4nbdFXHNqSI5B1kXTWK8',
            viewId: "DOCS",
            // token: token, // pass oauth token in case you already have one
            showUploadView: true,
            showUploadFolders: true,
            supportDrives: true,
            multiselect: true,
            // customViews: customViewsArray, // custom view
            callbackFunction: (data) => {
                if (data.action === 'cancel') {
                    console.log('User clicked cancel/close button')
                }
                console.log(data)
            },
        })
    }



    return (
        <div>
            <button onClick={() => handleOpenPicker()}>Open Picker</button>
        </div>
    );
}

export default App;