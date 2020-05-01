# NallanChatServer

Server for `https://github.com/Agilulfulus/NallanChatCLI`

Requires a working server with a MongoDB interface. Pulls the server url and user/password from a file called `secret-url.js` (Very creative on my part).

The layout of said file should appear thus:

```js
var url = "mongodb://[USERNAME]:[PASSWORD]@[IP-ADDRESS]/";

exports.url = url;
```

My running of the server is now defunct, because that stuff costs money and I didn't feel like paying more - but you are free to use the code here for whatever purpose you are interested in.
