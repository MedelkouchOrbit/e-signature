import axios from 'axios';
import { cloudServerUrl, mailTemplate, replaceMailVaribles, serverAppId } from '../../Utils.js';
const serverUrl = cloudServerUrl; //process.env.SERVER_URL;
const appId = serverAppId;

async function deductcount(docsCount, extUserId) {
  try {
    const extCls = new Parse.Query('contracts_Users');
    const extUser = await extCls.get(extUserId, { useMasterKey: true });
    if (extUser) {
      extUser.increment('DocumentCount', docsCount);
      await extUser.save(null, { useMasterKey: true });
      console.log('Document count updated successfully');
    }
  } catch (err) {
    console.log('Err in deduct in quick send', err);
  }
}

async function sendMail(document, publicUrl) {
  try {
    if (!publicUrl) {
      console.log('No publicUrl provided for sendMail');
      return;
    }

    const baseUrl = new URL(publicUrl);
    const timeToCompleteDays = document?.TimeToCompleteDays || 15;
    const ExpireDate = new Date(document.createdAt);
    ExpireDate.setDate(ExpireDate.getDate() + timeToCompleteDays);
    const newDate = ExpireDate;
    const localExpireDate = newDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let signerMail = document.Placeholders || [];
    if (!document?.ExtUserPtr?.Name || !document?.ExtUserPtr?.Email) {
      console.log('Missing ExtUserPtr data for sendMail');
      return;
    }

    const senderName = document.ExtUserPtr.Name;
    const senderEmail = document.ExtUserPtr.Email;

    if (document.SendinOrder) {
      signerMail = signerMail.slice();
      signerMail.splice(1);
    }

    for (let i = 0; i < signerMail.length; i++) {
      try {
        let url = `${serverUrl}/functions/sendmailv3`;
        const headers = { 'Content-Type': 'application/json', 'X-Parse-Application-Id': appId };
        const objectId = signerMail[i]?.signerObjId;
        const hostUrl = baseUrl.origin;
        let encodeBase64;
        let existSigner = {};
        if (objectId) {
          existSigner = document?.Signers?.find(user => user.objectId === objectId);
          encodeBase64 = btoa(`${document.objectId}/${existSigner?.Email}/${objectId}`);
        } else {
          encodeBase64 = btoa(`${document.objectId}/${signerMail[i].email}`);
        }
        let signPdf = `${hostUrl}/login/${encodeBase64}`;
        const orgName = document.ExtUserPtr.Company ? document.ExtUserPtr.Company : '';
        const senderObj = document?.ExtUserPtr;
        const mailBody = document?.ExtUserPtr?.TenantId?.RequestBody || '';
        const mailSubject = document?.ExtUserPtr?.TenantId?.RequestSubject || '';
        let replaceVar;
        if (mailBody && mailSubject) {
          const replacedRequestBody = mailBody.replace(/"/g, "'");
          const htmlReqBody =
            "<html><head><meta http-equiv='Content-Type' content/html; charset=UTF-8' /></head><body>" +
            replacedRequestBody +
            '</body></html>';
          const variables = {
            document_title: document?.Name,
            note: document?.Note || '',
            sender_name: senderName,
            sender_mail: senderEmail,
            sender_phone: senderObj?.Phone || '',
            receiver_name: existSigner?.Name || '',
            receiver_email: existSigner?.Email || signerMail[i].email,
            receiver_phone: existSigner?.Phone || '',
            expiry_date: localExpireDate,
            company_name: orgName,
            signing_url: signPdf,
          };
          replaceVar = replaceMailVaribles(mailSubject, htmlReqBody, variables);
        }
        const mailparam = {
          note: document?.Note || '',
          senderName: senderName,
          senderMail: senderEmail,
          title: document.Name,
          organization: orgName,
          localExpireDate: localExpireDate,
          signingUrl: signPdf,
        };
        let params = {
          extUserId: document.ExtUserPtr.objectId,
          recipient: existSigner?.Email || signerMail[i].email,
          subject: replaceVar?.subject ? replaceVar?.subject : mailTemplate(mailparam).subject,
          from: document.ExtUserPtr.Email,
          replyto: senderEmail || '',
          html: replaceVar?.body ? replaceVar?.body : mailTemplate(mailparam).body,
        };
        await axios.post(url, params, { headers: headers });
      } catch (error) {
        console.log('error', error);
      }
    }
  } catch (mailFunctionError) {
    console.log('Error in sendMail function:', mailFunctionError);
  }
}

async function updateSignersWithDocument(documentId, signers) {
  try {
    if (!signers || signers.length === 0) return;

    const updatePromises = signers.map(async (signer) => {
      if (!signer?.objectId) return;

      try {
        const signerQuery = new Parse.Query('contracts_Contactbook');
        const signerObj = await signerQuery.get(signer.objectId, { useMasterKey: true });

        if (signerObj) {
          // Add document to signer's documents array
          const currentDocs = signerObj.get('Documents') || [];
          const docPointer = {
            __type: 'Pointer',
            className: 'contracts_Document',
            objectId: documentId,
          };

          // Check if document is already in the array
          const docExists = currentDocs.some(doc => doc.objectId === documentId);
          if (!docExists) {
            currentDocs.push(docPointer);
            signerObj.set('Documents', currentDocs);
            await signerObj.save(null, { useMasterKey: true });
          }
        }
      } catch (signerError) {
        console.log(`Error updating signer ${signer.objectId}:`, signerError);
      }
    });

    await Promise.all(updatePromises);
    console.log('Signers updated successfully with document reference');
  } catch (error) {
    console.log('Error in updateSignersWithDocument:', error);
  }
}

async function batchQuery(userId, Documents, Ip, parseConfig, type, publicUrl) {
  const extCls = new Parse.Query('contracts_Users');
  extCls.equalTo('UserId', {
    __type: 'Pointer',
    className: '_User',
    objectId: userId,
  });
  const resExt = await extCls.first({ useMasterKey: true });
  if (resExt) {
    const _resExt = JSON.parse(JSON.stringify(resExt));
    try {
      const requests = Documents.map(x => {
        // Validate required fields
        if (!x?.CreatedBy?.objectId) {
          throw new Error('CreatedBy.objectId is required for each document');
        }

        // FIX: Handle null ExtUserPtr - use default values or skip if critical
        if (!x?.ExtUserPtr) {
          console.log('Warning: ExtUserPtr is null for document:', x.Name);
          // You can either throw an error or provide default values
          // For now, we'll provide default values
          x.ExtUserPtr = {
            objectId: resExt.id, // Use the current user's ID as fallback
            className: 'contracts_Users', // Default class name
            Name: _resExt.Name || 'Unknown',
            Email: _resExt.Email || '',
            Company: _resExt.Company || '',
            Phone: _resExt.Phone || ''
          };
        }

        if (!x?.ExtUserPtr?.objectId) {
          throw new Error('ExtUserPtr.objectId is required for each document');
        }

        const Signers = x.Signers || [];
        const allSigner = x?.Placeholders?.map(
          item => Signers?.find(e => item?.signerPtr?.objectId === e?.objectId) || item?.signerPtr
        ).filter(signer => signer && Object.keys(signer).length > 0 && signer.objectId && signer.objectId.trim() !== '') || [];
        const date = new Date();
        const isoDate = date.toISOString();
        let Acl = { [x.CreatedBy.objectId]: { read: true, write: true } };
        if (allSigner && allSigner.length > 0) {
          allSigner.forEach(signer => {
            if (signer?.CreatedBy?.objectId) {
              const obj = { [signer.CreatedBy.objectId]: { read: true, write: true } };
              Acl = { ...Acl, ...obj };
            }
          });
        }
        const mailBody = x?.ExtUserPtr?.TenantId?.RequestBody || '';
        const mailSubject = x?.ExtUserPtr?.TenantId?.RequestSubject || '';
        return {
          method: 'POST',
          path: '/app/classes/contracts_Document',
          body: {
            Name: x.Name,
            URL: x.URL,
            Note: x.Note,
            Description: x.Description,
            Status: 'waiting', // Add status field
            CreatedBy: x.CreatedBy,
            SendinOrder: x.SendinOrder || true,
            // FIX: Safe access to ExtUserPtr properties with fallbacks
            ExtUserPtr: {
              __type: 'Pointer',
              className: x.ExtUserPtr?.className || 'contracts_Users',
              objectId: x.ExtUserPtr?.objectId,
            },
            Placeholders: (x.Placeholders || []).map(y => {
              const placeholder = { ...y };
              // Only add signerPtr if we have a valid objectId
              if (y?.signerPtr?.objectId && y.signerPtr.objectId.trim() !== '') {
                placeholder.signerPtr = {
                  __type: 'Pointer',
                  className: 'contracts_Contactbook',
                  objectId: y.signerPtr.objectId,
                };
                placeholder.signerObjId = y.signerObjId || '';
              } else {
                // Remove signerPtr if objectId is empty or missing
                placeholder.signerPtr = {};
                placeholder.signerObjId = '';
              }
              placeholder.email = y?.signerPtr?.Email || y?.email || '';
              return placeholder;
            }),
            SignedUrl: x.URL || x.SignedUrl,
            SentToOthers: true,
            Signers: allSigner?.length > 0 ? allSigner.map(y => ({
              __type: 'Pointer',
              className: 'contracts_Contactbook',
              objectId: y.objectId,
            })) : [],
            ACL: Acl,
            SentToOthers: true,
            RemindOnceInEvery: x.RemindOnceInEvery ? parseInt(x.RemindOnceInEvery) : 5,
            AutomaticReminders: x.AutomaticReminders || false,
            TimeToCompleteDays: x.TimeToCompleteDays ? parseInt(x.TimeToCompleteDays) : 15,
            OriginIp: Ip,
            DocSentAt: { __type: 'Date', iso: isoDate },
            IsEnableOTP: x?.IsEnableOTP || false,
            IsTourEnabled: x?.IsTourEnabled || false,
            AllowModifications: x?.AllowModifications || false,
            ...(x?.SignatureType ? { SignatureType: x?.SignatureType } : {}),
            ...(x?.NotifyOnSignatures ? { NotifyOnSignatures: x?.NotifyOnSignatures } : {}),
            ...(x?.Bcc?.length > 0 ? { Bcc: x?.Bcc } : {}),
            ...(x?.RedirectUrl ? { RedirectUrl: x?.RedirectUrl } : {}),
            ...(mailBody ? { RequestBody: mailBody } : {}),
            ...(mailSubject ? { RequestSubject: mailSubject } : {}),
            ...(x?.objectId
              ? {
                  TemplateId: {
                    __type: 'Pointer',
                    className: 'contracts_Template',
                    objectId: x?.objectId,
                  },
                }
              : {}),
          },
        };
      });

      if (requests?.length > 0) {
        const newrequests = [requests?.[0]];
        const batchUrl = `${serverUrl}/batch`;
        console.log('Sending batch request to:', batchUrl);
        console.log('Batch headers:', parseConfig.headers);
        console.log('Request sample:', JSON.stringify(newrequests[0], null, 2));

        const response = await axios.post(batchUrl, { requests: newrequests }, {
          headers: parseConfig.headers,
          timeout: 30000, // 30 second timeout
        });

        console.log('Batch response:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data.length > 0) {
          const responseItem = response.data[0];
          if (responseItem?.success?.objectId) {
            const document = Documents?.[0];
            const updateDocuments = {
              ...document,
              objectId: responseItem.success.objectId,
              createdAt: responseItem.success.createdAt,
              // FIX: Safe handling of ExtUserPtr with proper fallbacks
              ExtUserPtr: document.ExtUserPtr ? {
                ...document.ExtUserPtr,
                objectId: document.ExtUserPtr.objectId || resExt.id,
                Name: document.ExtUserPtr.Name || _resExt.Name || 'Unknown',
                Email: document.ExtUserPtr.Email || _resExt.Email || '',
                Company: document.ExtUserPtr.Company || _resExt.Company || '',
                Phone: document.ExtUserPtr.Phone || _resExt.Phone || '',
                TenantId: document.ExtUserPtr.TenantId || _resExt.TenantId || null
              } : {
                // Fallback when ExtUserPtr is null
                objectId: resExt.id,
                Name: _resExt.Name || 'Unknown',
                Email: _resExt.Email || '',
                Company: _resExt.Company || '',
                Phone: _resExt.Phone || '',
                TenantId: _resExt.TenantId || null
              }
            };

            // Update signers with document reference
            const allSigner = document?.Placeholders?.map(
              item => document.Signers?.find(e => item?.signerPtr?.objectId === e?.objectId) || item?.signerPtr
            ).filter(signer => signer && Object.keys(signer).length > 0 && signer.objectId && signer.objectId.trim() !== '') || [];

            try {
              await updateSignersWithDocument(responseItem.success.objectId, allSigner);
            } catch (signerUpdateError) {
              console.log('Error updating signers:', signerUpdateError);
            }

            // Safely call deductcount and sendMail
            try {
              await deductcount(response.data.length, resExt.id);
            } catch (deductError) {
              console.log('Error in deductcount:', deductError);
            }

            try {
              await sendMail(updateDocuments, publicUrl);
            } catch (mailError) {
              console.log('Error in sendMail:', mailError);
            }

            return 'success';
          } else {
            console.log('Batch response success data missing:', responseItem);
            throw new Error('Document creation failed - no objectId in response');
          }
        } else {
          console.log('Empty or invalid batch response:', response.data);
          throw new Error('Document creation failed - empty response');
        }
      }
    } catch (error) {
      console.log('Error in batchQuery:', error.message);
      console.log('Error details:', error.response?.data || error.code);
      const code = error?.response?.data?.code || error?.response?.status || error?.code || 400;
      const msg =
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        'Something went wrong.';
      console.log('Error performing batch query:', code, msg);
      throw new Parse.Error(code, msg);
    }
  } else {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User not found.');
  }
}

export default async function createBatchDocs(request) {
  const strDocuments = request.params.Documents;
  const type = request.headers?.type || 'quicksend';

  if (!strDocuments) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Documents parameter is required.');
  }

  let Documents;
  try {
    Documents = JSON.parse(strDocuments);
  } catch (parseError) {
    console.log('Error parsing Documents JSON:', parseError);
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Invalid Documents JSON format.');
  }

  if (!Array.isArray(Documents) || Documents.length === 0) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Documents must be a non-empty array.');
  }

  const Ip = request?.headers?.['x-real-ip'] || '';
  // Access the host from the headers
  const publicUrl = request.headers.public_url;
  const parseConfig = {
    baseURL: serverUrl,
    headers: {
      'X-Parse-Application-Id': appId,
      'X-Parse-Master-Key': process.env.MASTER_KEY || 'myMasterKey',
      'Content-Type': 'application/json',
    },
  };
  console.log('Parse config headers:', parseConfig.headers);
  try {
    if (request?.user) {
      return await batchQuery(request.user.id, Documents, Ip, parseConfig, type, publicUrl);
    } else {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User is not authenticated.');
    }
  } catch (err) {
    console.log('err in createbatchdoc', err);
    const code = err?.code || 400;
    const msg = err?.message || 'Something went wrong.';
    throw new Parse.Error(code, msg);
  }
}
